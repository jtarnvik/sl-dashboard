import {ReactNode, useContext, useEffect, useRef, useState} from "react";
import classNames from "classnames";
import {MdSearch} from "react-icons/md";
import {TripOrigin, URL_GET_TRAVEL_v2} from "../../../communication/constant.ts";
import {fetchAbortable} from "../../../communication/fetch-abortable.ts";
import {interpretDeviations} from "../../../communication/backend.ts";
import {SLButton} from "../../common/sl-button";
import {StopAutocomplete} from "../../common/stop-autocomplete";
import {SldJourney} from "./sld-journey.tsx";
import {convertInfoMessages} from "../../common/deviation-modal";
import {BackendInterpretationResult, isValidDeviationText} from "../../../types/deviations-common.ts";
import {AbortControllerState} from "../../../types/communication.ts";
import {Journey, StopFinderLocation, SystemMessage} from "../../../types/sl-journeyplaner-responses.ts";
import ErrorContext from "../../../contexts/error-context.ts";

function ResultsPanel({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-full row-start-2 px-4 pt-2 pb-1 bg-[#F1F2F3] border border-t-0 border-gray-200 rounded-b-lg rounded-tr-lg text-gray-800">
      {children}
    </div>
  );
}

// Max initial walk time in minutes, the tr_it_mot_value100 parameter. There used to be a 15/60 selector for
// this; it was dropped and every search has used 15 since.
const MAX_INITIAL_WALK_TIME = 15;

type OriginMode = 'here' | 'stop';
type DestinationMode = 'home' | 'stop';
type TimeMode = 'now' | 'dep' | 'arr';

type Props = {
  settingsData: SettingsData
}

export function Routes({settingsData}: Props) {
  const {setError} = useContext(ErrorContext);
  const latestRequest = useRef<AbortControllerState | undefined>(undefined);
  const route1Ref = useRef<HTMLDivElement>(null);

  const [journeys, setJourneys] = useState<Journey[] | undefined>(undefined);
  const [deviationEnrichment, setDeviationEnrichment] = useState<Map<string, BackendInterpretationResult>>(new Map());
  const [interpretationPending, setInterpretationPending] = useState(false);

  const [timeMode, setTimeMode] = useState<TimeMode>('now');
  const [departureTime, setDepartureTime] = useState('');
  const [destinationStopId, setDestinationStopId] = useState<string | null>(null);
  const [originMode, setOriginMode] = useState<OriginMode>('here');
  const [originStopId, setOriginStopId] = useState<string | null>(null);
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('home');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reads ref.current at unmount time, not at setup time
    return () => latestRequest.current?.abort("Component unmounted");
  }, []);

  useEffect(() => {
    function handleDeviationHidden(e: Event) {
      const id = (e as CustomEvent<{ id: number }>).detail.id;
      setDeviationEnrichment(prev => {
        const next = new Map(prev);
        for (const [key, val] of next) {
          if (val.id === id) {
            next.delete(key);
          }
        }
        return next;
      });
    }
    window.addEventListener('deviationHidden', handleDeviationHidden);
    return () => window.removeEventListener('deviationHidden', handleDeviationHidden);
  }, []);

  async function processDeviationEnrichment(newJourneys: Journey[]) {
    const allMessages = newJourneys
      .flatMap(j => j.legs.flatMap(leg => convertInfoMessages(leg.infos ?? []).map(c => c.message)))
      .filter(isValidDeviationText);
    const uniqueMessages = [...new Set(allMessages)];
    if (uniqueMessages.length === 0) {
      setDeviationEnrichment(new Map());
      return;
    }
    setInterpretationPending(true);
    try {
      const results = await interpretDeviations(uniqueMessages, setError);
      if (results) {
        const enrichmentMap = new Map<string, BackendInterpretationResult>();
        uniqueMessages.forEach((msg, i) => {
          if (results[i]) {
            enrichmentMap.set(msg, results[i]);
          }
        });
        setDeviationEnrichment(enrichmentMap);
      }
    } finally {
      setInterpretationPending(false);
    }
  }

  function searchJourneys() {
    const destination = destinationMode === 'home' ? settingsData.stopPointId : destinationStopId;
    const stopOrigin = originMode === 'stop' ? originStopId : null;
    // Guards, not assertions: the Sök button is disabled in both of these states, so reaching here is a bug.
    // They run before anything is cleared, so an incomplete query leaves the last result on screen.
    if (!destination || (originMode === 'stop' && !stopOrigin)) {
      return;
    }
    // Rebound after the guard: the narrowing does not reach into the nested request builder below.
    const destinationId: string = destination;

    const timeParam = timeMode !== 'now' && departureTime ? departureTime.replace(':', '') : undefined;
    const timeType = timeMode !== 'now' ? timeMode : undefined;

    let dateParam: string | undefined;
    if (timeParam) {
      const now = new Date();
      const [h, m] = departureTime.split(':').map(Number);
      if (h * 60 + m < now.getHours() * 60 + now.getMinutes()) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const y = tomorrow.getFullYear();
        const mo = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const d = String(tomorrow.getDate()).padStart(2, '0');
        dateParam = `${y}${mo}${d}`;
      }
    }

    function generateRoute(origin: TripOrigin) {
      const url = URL_GET_TRAVEL_v2(origin, destinationId, MAX_INITIAL_WALK_TIME, timeParam, timeType, dateParam);
      fetchAbortable<{journeys: Journey[], systemMessages: SystemMessage[]}>(url, latestRequest, (data) => {
        const journeys = data.journeys ?? [];
        setJourneys(journeys);
        if (journeys.length > 0) {
          processDeviationEnrichment(journeys);
        }
      }, setError);
    }

    setJourneys(undefined);
    setDeviationEnrichment(new Map());

    // A named origin needs no geolocation at all: a denied permission or the 5s timeout below must not be able
    // to block a search that never depended on where the user is.
    if (stopOrigin) {
      generateRoute({kind: 'stop', id: stopOrigin});
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // position.coords also provides: accuracy (meters), altitude, altitudeAccuracy, heading, speed
    // and position.timestamp — available for future use (e.g. map display, E - map support)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        generateRoute({kind: 'coord', lat: position.coords.latitude, long: position.coords.longitude});
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  // Picking a stop is also a statement about which mode is wanted, so it selects the radio. Nothing here
  // clears the results: they are whatever the last Sök returned, and only the next Sök replaces them.
  function handleOriginSelect(location: StopFinderLocation) {
    setOriginMode('stop');
    setOriginStopId(location.id);
  }

  function handleDestinationSelect(location: StopFinderLocation) {
    setDestinationMode('stop');
    setDestinationStopId(location.id);
  }

  const hasJourneys = !!journeys && journeys.length > 0;
  const hasResultsPanel = journeys !== undefined;

  // Both ends must be named, and a timed search must say when. Without the last condition an empty time field
  // makes the URL omit the time parameters altogether, so Avfärd/Ankomst would silently search from now.
  const originReady = originMode === 'here' || !!originStopId;
  const destinationReady = destinationMode === 'home' || !!destinationStopId;
  const timeReady = timeMode === 'now' || departureTime !== '';
  const canSearch = originReady && destinationReady && timeReady;

  useEffect(() => {
    if (hasJourneys && route1Ref.current) {
      const navbarHeight = document.querySelector('nav')?.getBoundingClientRect().height ?? 0;
      const absoluteTop = route1Ref.current.getBoundingClientRect().top + window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = Math.min(maxScroll, absoluteTop - navbarHeight);
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [hasJourneys]);

  return (
    <>
      <div ref={route1Ref} className={classNames(
        'col-start-1 row-start-1 px-4 py-1 bg-[#F1F2F3] border border-gray-200 shadow-sm text-gray-800',
        hasResultsPanel ? 'rounded-t-lg border-b-0 relative z-10' : 'rounded-lg'
      )}>
        {/* One grid across both rows, not two flex rows: "Härifrån" is far wider than "Hem", so only a shared
            column can line the two stop fields up with each other. */}
        <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1 pt-1 pb-1">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="route-origin"
              checked={originMode === 'here'}
              onChange={() => setOriginMode('here')}
              className="accent-[#184fc2]"
            />
            Härifrån
          </label>
          {/* Focusing a stop field is a second way to choose that mode, which is why the field is dimmed
              rather than disabled. Captured on the wrapper so StopAutocomplete needs no onFocus prop. */}
          <input
            type="radio"
            name="route-origin"
            aria-label="Från vald hållplats"
            checked={originMode === 'stop'}
            onChange={() => setOriginMode('stop')}
            className="accent-[#184fc2]"
          />
          <div className="flex" onFocusCapture={() => setOriginMode('stop')}>
            <StopAutocomplete
              placeholder="Från hållplats…"
              dimmed={originMode === 'here'}
              onSelect={handleOriginSelect}
              onClear={() => setOriginStopId(null)}
              compact
            />
          </div>

          <label className="flex items-center gap-1" title={settingsData.stopPointName}>
            <input
              type="radio"
              name="route-destination"
              checked={destinationMode === 'home'}
              onChange={() => setDestinationMode('home')}
              className="accent-[#184fc2]"
            />
            Hem
          </label>
          <input
            type="radio"
            name="route-destination"
            aria-label="Till vald hållplats"
            checked={destinationMode === 'stop'}
            onChange={() => setDestinationMode('stop')}
            className="accent-[#184fc2]"
          />
          <div className="flex" onFocusCapture={() => setDestinationMode('stop')}>
            <StopAutocomplete
              placeholder="Till hållplats…"
              dimmed={destinationMode === 'home'}
              onSelect={handleDestinationSelect}
              onClear={() => setDestinationStopId(null)}
              compact
            />
          </div>
        </div>
        {/* All three time modes on one row. It fits an iPhone only just, so the gaps are tighter than the
            rows above and nothing here may wrap — a wrapped label would look like a layout bug rather than
            showing that the row has run out of room. */}
        <div className="flex items-center gap-2 pb-1">
          <label className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <input
              type="radio"
              name="departure-time"
              checked={timeMode === 'now'}
              onChange={() => setTimeMode('now')}
              className="accent-[#184fc2]"
            />
            Nu
          </label>
          <label className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <input
              type="radio"
              name="departure-time"
              checked={timeMode === 'dep'}
              onChange={() => setTimeMode('dep')}
              className="accent-[#184fc2]"
            />
            Avfärd
          </label>
          <label className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <input
              type="radio"
              name="departure-time"
              checked={timeMode === 'arr'}
              onChange={() => setTimeMode('arr')}
              className="accent-[#184fc2]"
            />
            Ankomst
          </label>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            disabled={timeMode === 'now'}
            className={classNames(
              'shrink-0 rounded-sm border border-gray-300 bg-white px-1 py-px text-sm',
              timeMode === 'now' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'
            )}
          />
        </div>
        <div className="flex justify-end pb-1">
          <SLButton onClick={searchJourneys} thin disabled={!canSearch}>
            <span className="flex items-center gap-1"><MdSearch className="h-4 w-4" />Sök</span>
          </SLButton>
        </div>
        {hasResultsPanel && (
          <div className="absolute -bottom-2 left-[-1px] right-[-1px] h-2 bg-[#F1F2F3] border-x border-gray-200" />
        )}
      </div>
      {hasResultsPanel && !hasJourneys && (
        <ResultsPanel>
          <p className="text-sm text-gray-500 py-1">Inga reseförslag hittades — är du redan framme?</p>
        </ResultsPanel>
      )}
      {hasJourneys && (
        <ResultsPanel>
          {journeys.map((journey, index) => (
            <div key={index}>
              <SldJourney journey={journey} deviationEnrichment={deviationEnrichment} interpretationPending={interpretationPending} />
            </div>
          ))}
        </ResultsPanel>
      )}
    </>
  );
}

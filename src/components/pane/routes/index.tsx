import {ReactNode, useContext, useEffect, useRef, useState} from "react";
import classNames from "classnames";
import {MdSearch} from "react-icons/md";
import {URL_GET_TRAVEL_COORD_TO_v2} from "../../../communication/constant.ts";
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

  const [timeMode, setTimeMode] = useState<'now' | 'dep' | 'arr'>('now');
  const [departureTime, setDepartureTime] = useState('');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

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

  function updateDepartures(maxWalk: number, destinationId?: string, timeModeOverride?: 'now' | 'dep' | 'arr', departureTimeOverride?: string) {
    const destination = destinationId ?? settingsData.stopPointId;
    const effectiveMode = timeModeOverride ?? timeMode;
    const effectiveTime = departureTimeOverride ?? departureTime;
    const timeParam = effectiveMode !== 'now' && effectiveTime ? effectiveTime.replace(':', '') : undefined;
    const timeType = effectiveMode !== 'now' ? effectiveMode : undefined;

    let dateParam: string | undefined;
    if (timeParam && effectiveTime) {
      const now = new Date();
      const [h, m] = effectiveTime.split(':').map(Number);
      if (h * 60 + m < now.getHours() * 60 + now.getMinutes()) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const y = tomorrow.getFullYear();
        const mo = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const d = String(tomorrow.getDate()).padStart(2, '0');
        dateParam = `${y}${mo}${d}`;
      }
    }

    function generateRoute(lat: number, long: number, maxInitialWalkTime: number) {
      const url = URL_GET_TRAVEL_COORD_TO_v2(long, lat, destination, maxInitialWalkTime, timeParam, timeType, dateParam);
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

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // position.coords also provides: accuracy (meters), altitude, altitudeAccuracy, heading, speed
    // and position.timestamp — available for future use (e.g. map display, E - map support)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        generateRoute(position.coords.latitude, position.coords.longitude, maxWalk);
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

  function handleTimeModeChange(newMode: 'now' | 'dep' | 'arr') {
    setTimeMode(newMode);
    setDepartureTime('');
    setJourneys(undefined);
    setDeviationEnrichment(new Map());
    if (newMode === 'now') {
      updateDepartures(15, selectedStopId ?? undefined, 'now', '');
    }
  }

  function handleStopSelect(location: StopFinderLocation) {
    setSelectedStopId(location.id);
    updateDepartures(15, location.id);
  }

  function handleClear() {
    setSelectedStopId(null);
    setJourneys(undefined);
    setDeviationEnrichment(new Map());
  }

  const hasJourneys = !!journeys && journeys.length > 0;
  const hasResultsPanel = journeys !== undefined;

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
        <div className="text-gray-800 pt-1">Ta mig till</div>
        <div className="flex items-center gap-2 pb-1">
          <SLButton onClick={() => updateDepartures(15)} thin>Hem</SLButton>
          <StopAutocomplete onSelect={handleStopSelect} onClear={handleClear} compact />
        </div>
        <div className="flex items-center pb-1">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="departure-time"
              checked={timeMode === 'now'}
              onChange={() => handleTimeModeChange('now')}
              className="accent-[#184fc2]"
            />
            Nu
          </label>
        </div>
        <div className="flex items-center gap-3 pb-1">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="departure-time"
              checked={timeMode === 'dep'}
              onChange={() => handleTimeModeChange('dep')}
              className="accent-[#184fc2]"
            />
            Avfärd
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="departure-time"
              checked={timeMode === 'arr'}
              onChange={() => handleTimeModeChange('arr')}
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
              'rounded-sm border border-gray-300 bg-white px-1 py-px text-sm',
              timeMode === 'now' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'
            )}
          />
          <SLButton
            onClick={() => updateDepartures(15, selectedStopId ?? undefined)}
            thin
            disabled={timeMode === 'now'}
          >
            <MdSearch className="h-5 w-4" />
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

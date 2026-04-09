import {useContext, useEffect, useRef, useState} from "react";
import axios from "axios";
import classNames from "classnames";
import {Combobox, ComboboxInput, ComboboxOption, ComboboxOptions} from "@headlessui/react";
import {IoCloseCircle} from "react-icons/io5";
import {URL_GET_STOP_POINT, URL_GET_TRAVEL_COORD_TO_v2} from "../../../communication/constant.ts";
import {fetchAbortable} from "../../../communication/fetch-abortable.ts";
import {interpretDeviations} from "../../../communication/backend.ts";
import {SLButton} from "../../common/sl-button";
import {SldJourney} from "./sld-journey.tsx";
import {convertInfoMessages} from "../../common/deviation-modal";
import {BackendInterpretationResult, isValidDeviationText} from "../../../types/deviations-common.ts";
import {AbortControllerState} from "../../../types/communication.ts";
import {Journey, StopFinderLocation, StopFinderResponse, SystemMessage} from "../../../types/sl-journeyplaner-responses";
import ErrorContext from "../../../contexts/error-context.ts";

type Location = {
  latitude: number,
  longitude: number,
  accuracy: number, // in meters
  altitude: number | null,
  altitudeAccuracy: number | null,
  heading: number | null,
  speed: number | null,
  timestamp: number | null
};

type Props = {
  settingsData: SettingsData
}

export function Routes({settingsData}: Props) {
  const {setError} = useContext(ErrorContext);
  const latestRequest = useRef<AbortControllerState | undefined>(undefined);
  const route1Ref = useRef<HTMLDivElement>(null);

  const [journeys, setJourneys] = useState<Journey[] | undefined>(undefined);
  const [, setSystemMessages] = useState<SystemMessage[] | undefined>(undefined);
  const [deviationEnrichment, setDeviationEnrichment] = useState<Map<string, BackendInterpretationResult>>(new Map());
  const [interpretationPending, setInterpretationPending] = useState(false);

  const [, setLocation] = useState<Location | undefined>(undefined);
  const [geoInfo, setGeoInfo] = useState<string | undefined>(undefined);
  const [, setRoutePlanningInProgress] = useState<boolean>(false);
  const [state, setState] = useState<string>("");

  const [timeMode, setTimeMode] = useState<'now' | 'dep' | 'arr'>('now');
  const [departureTime, setDepartureTime] = useState('');

  const [query, setQuery] = useState('');
  const [stopResults, setStopResults] = useState<StopFinderLocation[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopFinderLocation | null>(null);
  const searchAbortRef = useRef<AbortController | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reads ref.current at unmount time, not at setup time
    return () => {
      latestRequest.current?.abort("Component unmounted");
      clearTimeout(debounceRef.current);
      searchAbortRef.current?.abort();
    };
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

    function generateRoute(lat: number, long: number, maxInitialWalkTime: number) {
      const url = URL_GET_TRAVEL_COORD_TO_v2(long, lat, destination, maxInitialWalkTime, timeParam, timeType);
      fetchAbortable<{journeys: Journey[], systemMessages: SystemMessage[]}>(url, latestRequest, (data) => {
        setJourneys(data.journeys);
        setSystemMessages(data.systemMessages);
        if (data.journeys) {
          processDeviationEnrichment(data.journeys);
        } else {
          setState("No routes, are you already there?")
        }
      }, setError);
    }

    setRoutePlanningInProgress(true);
    setLocation(undefined);
    setGeoInfo(undefined);
    setJourneys(undefined);
    setSystemMessages(undefined);
    setDeviationEnrichment(new Map());

    if (!navigator.geolocation) {
      setGeoInfo('Geolocation is not supported by your browser');
      setRoutePlanningInProgress(false);
      return;
    }

    // Get current position once
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,    // 59,....
          longitude: position.coords.longitude,  // 17,....
          accuracy: position.coords.accuracy,    // in meters
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
        setRoutePlanningInProgress(false);
        generateRoute(position.coords.latitude, position.coords.longitude, maxWalk);
      },
      (err) => {
        setState("Error: " + err.message);
        setRoutePlanningInProgress(false);
        setGeoInfo(err.message);
      },
      {
        enableHighAccuracy: true, // Request GPS if available
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  function handleTimeModeChange(newMode: 'now' | 'dep' | 'arr') {
    setTimeMode(newMode);
    if (newMode === 'now') {
      setDepartureTime('');
      updateDepartures(15, selectedStop?.id, 'now', '');
    } else if (departureTime.length === 5) {
      updateDepartures(15, selectedStop?.id, newMode, departureTime);
    }
  }

  function handleTimeChange(value: string) {
    setDepartureTime(value);
    if (value.length === 5) {
      updateDepartures(15, selectedStop?.id, timeMode, value);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedStop(null);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setStopResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      try {
        const response = await axios.get<StopFinderResponse>(URL_GET_STOP_POINT(value.trim()), {
          signal: controller.signal
        });
        setStopResults((response.data.locations ?? []).slice(0, 5));
      } catch {
        // abort errors and network errors are ignored silently
      }
    }, 300);
  }

  function handleStopSelect(location: StopFinderLocation) {
    setSelectedStop(location);
    setQuery(location.disassembledName ?? location.name);
    setStopResults([]);
    updateDepartures(15, location.id);
  }

  function handleClear() {
    setSelectedStop(null);
    setQuery('');
    setStopResults([]);
    setJourneys(undefined);
    setSystemMessages(undefined);
    setDeviationEnrichment(new Map());
    setState('');
    setGeoInfo(undefined);
  }

  const hasJourneys = !!journeys && journeys.length > 0;

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
        hasJourneys ? 'rounded-t-lg border-b-0 relative z-10' : 'rounded-lg'
      )}>
        <div className="text-gray-800 pt-1">Ta mig till</div>
        <div className="flex items-center gap-2 pb-1">
          <SLButton onClick={() => updateDepartures(15)} thin>Hem</SLButton>
          <div className="relative flex-1">
            <Combobox onChange={(loc: StopFinderLocation | null) => { if (loc) { handleStopSelect(loc); } }}>
              <ComboboxInput
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Sök hållplats…"
                className="w-full rounded-sm border border-gray-300 bg-white px-2 py-px pr-6 text-sm text-gray-800"
              />
              {stopResults.length > 0 && (
                <ComboboxOptions static className="absolute left-0 right-0 top-full z-30 mt-1 rounded-sm border border-gray-200 bg-white shadow-md">
                  {stopResults.map(loc => (
                    <ComboboxOption
                      key={loc.id}
                      value={loc}
                      className="cursor-pointer px-3 py-1 text-sm data-focus:bg-[#184fc2] data-focus:text-white"
                    >
                      {loc.disassembledName ?? loc.name}
                      {loc.parent?.name && (
                        <span className="ml-1 text-xs opacity-60">{loc.parent.name}</span>
                      )}
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              )}
            </Combobox>
            {selectedStop && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <IoCloseCircle className="h-4 w-4" />
              </button>
            )}
          </div>
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
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={timeMode === 'now'}
            className={classNames(
              'rounded-sm border border-gray-300 bg-white px-1 py-px text-sm',
              timeMode === 'now' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'
            )}
          />
        </div>
        {state && <div className="text-sm pb-1">{state}</div>}
        {geoInfo && <div className="text-sm pb-1">{geoInfo}</div>}
        {hasJourneys && (
          <div className="absolute -bottom-2 left-[-1px] right-[-1px] h-2 bg-[#F1F2F3] border-x border-gray-200" />
        )}
      </div>
      {hasJourneys && (
        <div className="col-span-full row-start-2 px-4 pt-2 pb-1 bg-[#F1F2F3] border border-t-0 border-gray-200 rounded-b-lg rounded-tr-lg text-gray-800">
          {journeys.map((journey, index) => (
            <div key={index}>
              <SldJourney journey={journey} deviationEnrichment={deviationEnrichment} interpretationPending={interpretationPending} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

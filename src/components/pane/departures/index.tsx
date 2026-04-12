import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {MdInfoOutline, MdRefresh, MdWarningAmber} from "react-icons/md";
import {DateTime, Duration} from "luxon";
import {URL_GET_DEPARTURES_FROM_SITE} from "../../../communication/constant.ts";
import {fetchAbortable} from "../../../communication/fetch-abortable.ts";
import {interpretDeviations} from "../../../communication/backend.ts";
import {Card} from "../../common/card";
import {LineJourney, TransportationIconCommon, TransportationMode} from "../../common/line";
import {ModalDialog} from "../../common/modal-dialog";
import {SLButton} from "../../common/sl-button";
import {DeviationWrapper} from "../../common/deviation-wrapper";
import {ScanningUnderline} from "../../common/scanning-underline";
import {BackendInterpretationResult, EnrichedDeviation, isShown, isValidDeviationText} from "../../../types/deviations-common.ts";
import InDebugModeContext from "../../../contexts/debug-context.ts";
import {useVisibility} from "../../../hook/use-visibility.ts";
import {AbortControllerState} from "../../../types/communication.ts";
import {Departure, SlDeparturesResponse, TransportMode} from "../../../types/sl-responses.ts";
import {shortSwedishHumanizer} from "../../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../../util/sorters.ts";
import {Destination} from "./destination.tsx";
import {destinations, symbols} from "./legend-data.tsx";
import {Legend} from "./legend.tsx";
import "./index.css";
import ErrorContext from "../../../contexts/error-context.ts";

const MAX_DEPARTURES_BEFORE_GROUPING = 16;

function transportModeToIconMode(mode: TransportMode): TransportationMode {
  switch (mode) {
    case 'BUS':   return TransportationMode.BUS;
    case 'METRO': return TransportationMode.SUBWAY;
    case 'TRAIN': return TransportationMode.TRAIN;
    case 'TRAM':  return TransportationMode.TRAM;
    case 'FERRY': return TransportationMode.FERRY;
    case 'SHIP':  return TransportationMode.SHIP;
    case 'TAXI':  return TransportationMode.TAXI;
    default:      return TransportationMode.UNKNOWN;
  }
}

type Props = {
  stopPoint16Chars: string
}

export function Departures({stopPoint16Chars}: Props) {
  const {inDebugMode} = useContext(InDebugModeContext);
  const {setError} = useContext(ErrorContext);

  const latestRequest = useRef<AbortControllerState | undefined>(undefined);
  const lastDepartures = useRef<Departure[] | undefined>(undefined);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const updateDeparturesRef = useRef<() => void>(() => {});
  const [departing, setDeparting] = useState<Set<string>>(new Set());
  const [isStale, setIsStale] = useState(false);

  const [departures, setDepartures] = useState<SlDeparturesResponse | undefined>(undefined);
  const [deviationEnrichment, setDeviationEnrichment] = useState<Map<string, BackendInterpretationResult>>(new Map());
  const [interpretationPending, setInterpretationPending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<DateTime | undefined>(undefined);
  const [diffSinceLastUpdated, setDiffSinceLastUpdated] = useState<Duration | undefined>(undefined);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);
  const [jsonOpen, setJsonOpen] = useState<boolean>(false);
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportMode | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  function getUniqueId(dept: Departure): string {
    return `${dept.line.id}-${dept.journey.id}`;
  }

  const updateDiffSinceLatUpdated = useCallback(() => {
    setDiffSinceLastUpdated(lastUpdated?.diffNow())
  }, [lastUpdated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reads ref.current at unmount time, not at setup time
    return () => {
      latestRequest.current?.abort("Component unmounted");
      clearTimeout(retryTimeout.current);
    };
  }, []);

  const processDeviationEnrichment = useCallback(async (deps: Departure[]) => {
    const allMessages = deps
      .flatMap(dep => dep.deviations ?? [])
      .map(dev => dev.message)
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
  }, [setError]);

  const scheduleRetryIfNeeded = useCallback(() => {
    const hour = DateTime.now().hour;
    if (hour >= 6 && hour <= 22) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = setTimeout(() => updateDeparturesRef.current(), 5000);
    }
  }, []);

  const updateDepartures = useCallback(() => {
    const url = URL_GET_DEPARTURES_FROM_SITE(stopPoint16Chars.slice(-4));
    fetchAbortable<SlDeparturesResponse>(url, latestRequest, (data) => {
      if (data.departures.length === 0) {
        if (lastDepartures.current && lastDepartures.current.length > 0) {
          setIsStale(true);
        } else {
          setDepartures(data);
          setIsStale(true);
        }
        scheduleRetryIfNeeded();
        return;
      }

      clearTimeout(retryTimeout.current);
      retryTimeout.current = undefined;
      setIsStale(false);
      processDeviationEnrichment(data.departures);
      const lastDepts = lastDepartures.current;
      if (lastDepts) {
        const lastIds = lastDepts.map(dep => getUniqueId(dep));
        const newIds = data.departures.map(dep => getUniqueId(dep));
        const newIdSet = new Set(newIds);
        const removedIds = lastIds.filter(id => !newIdSet.has(id));

        // console.log("removedIds", removedIds);
        if (removedIds.length === 0) {
          lastDepartures.current = data.departures;
          setDeparting(new Set([]));
          setDepartures(data);
          setLastUpdated(DateTime.now());
          setDiffSinceLastUpdated(DateTime.now().diffNow())
        } else if (removedIds.length > 2) {
          // too many, just update
          lastDepartures.current = data.departures;
          setDeparting(new Set([]));
          setDepartures(data);
          setLastUpdated(DateTime.now());
          setDiffSinceLastUpdated(DateTime.now().diffNow())
        } else {
          setDeparting(new Set(removedIds));
          setTimeout(() => {
            lastDepartures.current = data.departures;
            setDeparting(new Set([]));
            setDepartures(data);
            setLastUpdated(DateTime.now());
            setDiffSinceLastUpdated(DateTime.now().diffNow())
          }, 1250)
        }
      } else {
        lastDepartures.current = data.departures;
        setDepartures(data);
        setLastUpdated(DateTime.now());
        setDiffSinceLastUpdated(DateTime.now().diffNow())
      }
    }, setError);
  }, [stopPoint16Chars, setError, processDeviationEnrichment, scheduleRetryIfNeeded]);

  useEffect(() => {
    updateDeparturesRef.current = updateDepartures;
  }, [updateDepartures]);

  useVisibility({onVisible: updateDepartures});

  useEffect(() => {
    updateDepartures();
    const intervalId = setInterval(() => {
      updateDepartures();
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [updateDepartures]);

  useEffect(() => {
    const intervalId = setInterval(updateDiffSinceLatUpdated, 1000);
    return () => clearInterval(intervalId);
  }, [updateDiffSinceLatUpdated]);

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

  useEffect(() => {
    const sorted = sortDeparturesByDestination(departures?.departures);
    const isNowGrouped = sorted.length > MAX_DEPARTURES_BEFORE_GROUPING;
    if (!isNowGrouped) {
      setSelectedTransportMode(null);
      setCurrentPage(0);
      return;
    }
    const modes: TransportMode[] = [...new Set(sorted.map(d => d.line.transport_mode))];
    setSelectedTransportMode(prev => {
      if (prev && modes.includes(prev)) { return prev; }
      return modes.includes('BUS') ? 'BUS' : (modes[0] ?? null);
    });
    setCurrentPage(0);
  }, [departures]);

  function handleLegend() {
    setLegendOpen(true);
  }

  function handleJSON() {
    setJsonOpen(true);
  }

  const departurePres: Departure[] = sortDeparturesByDestination(departures?.departures);
  const isGrouped = departurePres.length > MAX_DEPARTURES_BEFORE_GROUPING;
  const transportModes: TransportMode[] = [...new Set(departurePres.map(d => d.line.transport_mode))];
  const activeTypeDepartures: Departure[] = isGrouped && selectedTransportMode
    ? departurePres.filter(d => d.line.transport_mode === selectedTransportMode)
    : departurePres;
  const pageCount = Math.ceil(activeTypeDepartures.length / MAX_DEPARTURES_BEFORE_GROUPING);
  const isPaged = isGrouped && pageCount > 1;
  const displayedDepartures: Departure[] = isPaged
    ? activeTypeDepartures.slice(currentPage * MAX_DEPARTURES_BEFORE_GROUPING, (currentPage + 1) * MAX_DEPARTURES_BEFORE_GROUPING)
    : activeTypeDepartures;

  function handleTypeSelect(mode: TransportMode) {
    if (mode === selectedTransportMode) { return; }
    setSelectedTransportMode(mode);
    setCurrentPage(0);
  }

  return (
    <Card>
      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          Uppdaterad {((diffSinceLastUpdated) ? shortSwedishHumanizer(diffSinceLastUpdated?.toMillis()) : "-")}
          {isStale && <MdWarningAmber className="size-4 text-amber-400" />}
        </div>
        <div>Avgår</div>
      </div>
      {displayedDepartures.length === 0 && departures !== undefined && (
        <div className="text-sm text-gray-500 py-1">
          Inga avgångar för tillfället —{" "}
          <span className="text-[#184fc2] hover:text-[#578ff3] cursor-pointer" onClick={updateDepartures}>
            Uppdatera
          </span>
        </div>
      )}
      {displayedDepartures.length > 0 &&
        displayedDepartures.map((departure) => {
            const uniqueId = getUniqueId(departure);
            const showAsDeparting = departing.has(getUniqueId(departure));

            return (
              <div key={uniqueId} className={"departures-grid " + ((showAsDeparting) ? "departure-row-removing" : "")}>
                <div className="grid-line justify-self-start">
                  <LineJourney
                    extraIconClass="departure-icon"
                    line={departure.line}
                    journey={departure.journey}
                    hideDesignation={showAsDeparting}
                  />
                </div>
                <div className="grid-name departure-row">
                  <Destination journey={departure.journey} destination={departure.destination} />
                </div>
                <div className="grid-time justify-self-end departure-row">
                  <ScanningUnderline active={interpretationPending && (departure.deviations ?? []).length > 0}>
                    <DeviationWrapper deviations={
                      (departure.deviations ?? [])
                        .map(dev => {
                          const result = deviationEnrichment.get(dev.message);
                          if (!result) { return null; }
                          return { message: dev.message, ...result } as EnrichedDeviation;
                        })
                        .filter((d): d is EnrichedDeviation => d !== null)
                        .filter(isShown)
                    }>
                      {departure.display}
                    </DeviationWrapper>
                  </ScanningUnderline>
                </div>
              </div>
            );
          }
        )}
      <div className="w-full flex items-center mt-1">
        <div className="flex items-center gap-1">
          {isGrouped && transportModes.map(mode => (
            <button
              key={mode}
              onClick={() => handleTypeSelect(mode)}
              className={`p-1 rounded-sm ${selectedTransportMode === mode ? 'bg-[#184fc2] text-white' : 'text-gray-500 hover:bg-gray-200'}`}
              aria-label={mode}
            >
              <TransportationIconCommon mode={transportModeToIconMode(mode)} className="size-4" />
            </button>
          ))}
        </div>
        <div className="flex-1 flex justify-center items-center gap-1">
          {isPaged && Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`px-1.5 py-0.5 rounded-sm text-xs ${currentPage === i ? 'bg-[#184fc2] text-white' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-1">
          {inDebugMode && <SLButton onClick={handleJSON} thin>JSON</SLButton>}
          <SLButton onClick={updateDepartures} thin><MdRefresh className="h-5 w-4" /></SLButton>
          <SLButton onClick={handleLegend} thin><MdInfoOutline className="h-5 w-4" /></SLButton>
        </div>
      </div>
      <ModalDialog
        isOpen={legendOpen}
        onClose={() => setLegendOpen(false)}
        title={"Symboler"}
      >
        <Legend legendData={symbols} title="Linjesymbol"  />
        <Legend legendData={destinations} title="Destination" />
      </ModalDialog>
      <ModalDialog
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
        title={"Response Data"}
        scrollable={true}
      >
        <pre>
          {JSON.stringify(departures, null, 2)}
        </pre>
      </ModalDialog>
    </Card>
  )
}

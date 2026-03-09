import {useCallback, useContext, useEffect, useImperativeHandle, useRef, useState} from "react";
import axios from 'axios';
import {DateTime, Duration} from "luxon";
import {URL_GET_DEPARTURES_FROM_SITE} from "../../../communication/constant.ts";
import {Card} from "../../common/card";
import {LineJourney} from "../../common/line";
import {ModalDialog} from "../../common/modal-dialog";
import {SLButton} from "../../common/sl-button";
import {DeviationWrapper} from "../../common/deviation-wrapper";
import InDebugModeContext from "../../../contexts/debug-context.ts";
import {useVisibility} from "../../../hook/use-visibility.ts";
import {AbortControllerState, createAbortController, isAbortError} from "../../../types/communication.ts";
import {Departure, SlDeparturesResponse} from "../../../types/sl-responses.ts";
import {shortSwedishHumanizer} from "../../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../../util/sorters.ts";
import {Destination} from "./destination.tsx";
import {destinations, symbols} from "./legend-data.tsx";
import {Legend} from "./legend.tsx";
import "./index.css";
import ErrorContext from "../../../contexts/error-context.ts";

type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>,
  stopPoint16Chars: string
}

export function Departures({performManualUpdate, stopPoint16Chars}: Props) {
  const {inDebugMode} = useContext(InDebugModeContext);
  const {setError} = useContext(ErrorContext);

  const latestRequest = useRef<AbortControllerState | undefined>(undefined);
  const lastDepartures = useRef<Departure[] | undefined>(undefined);
  const [departing, setDeparting] = useState<Set<string>>(new Set());

  const [departures, setDepartures] = useState<SlDeparturesResponse | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<DateTime | undefined>(undefined);
  const [diffSinceLastUpdated, setDiffSinceLastUpdated] = useState<Duration | undefined>(undefined);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);
  const [jsonOpen, setJsonOpen] = useState<boolean>(false);

  function getUniqueId(dept: Departure): string {
    return `${dept.line.id}-${dept.journey.id}`;
  }

  const updateDiffSinceLatUpdated = useCallback(() => {
    setDiffSinceLastUpdated(lastUpdated?.diffNow())
  }, [lastUpdated]);

  useEffect(() => {
    return () => latestRequest.current?.abort("Component unmounted");
  }, []);

  const updateDepartures = useCallback(() => {
    if (latestRequest.current) {
      latestRequest.current.abort("Previous request contains stale data");
    }
    const controller = createAbortController();
    latestRequest.current = controller;

    const url = URL_GET_DEPARTURES_FROM_SITE(stopPoint16Chars.slice(-4));
    axios.get<SlDeparturesResponse>(url, {
      signal: controller.signal,
    })
      .then(function (response) {
        const lastDepts = lastDepartures.current;
        if (lastDepts) {
          const lastIds = lastDepts.map(dep => getUniqueId(dep));
          const newIds = response.data.departures.map(dep => getUniqueId(dep));
          const newIdSet = new Set(newIds);
          const removedIds = lastIds.filter(id => !newIdSet.has(id));

          // console.log("removedIds", removedIds);
          if (removedIds.length === 0) {
            lastDepartures.current = response.data.departures;
            setDeparting(new Set([]));
            setDepartures(response.data);
            setLastUpdated(DateTime.now());
            setDiffSinceLastUpdated(DateTime.now().diffNow())
          } else if (removedIds.length > 2) {
            // too many, just update
            lastDepartures.current = response.data.departures;
            setDeparting(new Set([]));
            setDepartures(response.data);
            setLastUpdated(DateTime.now());
            setDiffSinceLastUpdated(DateTime.now().diffNow())
          } else {
            setDeparting(new Set(removedIds));
            setTimeout(() => {
              lastDepartures.current = response.data.departures;
              setDeparting(new Set([]));
              setDepartures(response.data);
              setLastUpdated(DateTime.now());
              setDiffSinceLastUpdated(DateTime.now().diffNow())
            }, 1250)
          }
        } else {
          lastDepartures.current = response.data.departures;
          setDepartures(response.data);
          setLastUpdated(DateTime.now());
          setDiffSinceLastUpdated(DateTime.now().diffNow())
        }
      })
      .catch(function (error) {
        // Treat aborts as "expected"
        if (isAbortError(error)) {
          return;
        }
        setError(error);
      })
      .finally(function () {
        // Clear ONLY if this request is still the latest one
        if (latestRequest.current === controller) {
          latestRequest.current = undefined;
        }
      });
  }, [stopPoint16Chars]);

  useVisibility({onVisible: updateDepartures});

  function manualUpdate() {
    updateDepartures();
  }

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

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  function handleLegend() {
    setLegendOpen(true);
  }

  function handleJSON() {
    setJsonOpen(true);
  }

  const departurePres: Departure[] = sortDeparturesByDestination(departures?.departures);
  return (
    <Card>
      <div className="flex justify-between">
        <div>Uppdaterad {((diffSinceLastUpdated) ? shortSwedishHumanizer(diffSinceLastUpdated?.toMillis()) : "-")}</div>
        <div>Avgår</div>
      </div>
      {departurePres.length > 0 &&
        departurePres.map((departure) => {
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
                  <div className={"relative " }>
                    <DeviationWrapper departure={departure}>
                      {departure.display}
                    </DeviationWrapper>
                  </div>
                </div>
              </div>
            );
          }
        )}
      <div className="w-full flex justify-end space-x-1">
        {inDebugMode &&
          <SLButton onClick={handleJSON} thin>JSON</SLButton>
        }
        <SLButton onClick={handleLegend} thin>Symboler</SLButton>
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

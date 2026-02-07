import {useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";
import axios from 'axios';
import {URL_GET_DEPARTURES_FROM_SITE} from "../../communication/constant.ts";
import {DateTime, Duration} from "luxon";
import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../util/sorters.ts";
import {useVisibility} from "../../hook/use-visibility.ts";
import {LineJourney} from "../common/line";
import {Card} from "../common/card";

import "./index.css"
import {Destination} from "./destination.tsx";
import {SLButton} from "../common/sl-button";
import {ModalDialog} from "../common/modal-dialog";
import {destinations, symbols} from "./legend-data.tsx";
import {Legend} from "./legend.tsx";
import {AbortControllerState, createAbortController} from "../../types/communication.ts";

type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>,
  stopPoint16Chars: string
}

export function NextDeparture({performManualUpdate, stopPoint16Chars}: Props) {
  const latestRequest = useRef<AbortControllerState | undefined>(undefined);

  const [departures, setDepartures] = useState<SlDeparturesResponse | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<DateTime | undefined>(undefined);
  const [diffSinceLastUpdated, setDiffSinceLastUpdated] = useState<Duration | undefined>(undefined);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);
  const [jsonOpen, setJsonOpen] = useState<boolean>(false);

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
    axios.get(url, {
      signal: controller.signal,
    })
      .then(function (response) {
        setDepartures(response.data);
        setLastUpdated(DateTime.now());
        setDiffSinceLastUpdated(DateTime.now().diffNow())

        // console.log(response);
      })
      .catch(function (error) {
        // TODO: Log error
        // handle error
        console.log(error);
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
    const intervalId = setInterval(updateDepartures, 60 * 1000);
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
        departurePres.map((departure, index) =>
          <div key={index} className="departures-grid">
            <div className="grid-line justify-self-start">
              <LineJourney line={departure.line} journey={departure.journey} />
            </div>
            <div className="grid-name">
              <Destination journey={departure.journey} destination={departure.destination} />
            </div>
            <div className="grid-time justify-self-end">
              <div className="relative">
                {departure.display}
                {departure.deviations && departure.deviations.length > 0 &&
                  <div className="absolute top-[0px] -right-[1px] w-0 h-0
                      border-l-[4px] border-l-transparent
                      border-r-[4px] border-r-transparent
                      border-b-[7px] border-b-orange-500">
                  </div>
                }
              </div>
            </div>
          </div>
        )}
      <div className="w-full flex justify-end space-x-1">
        <SLButton onClick={handleJSON} thin>JSON</SLButton>
        <SLButton onClick={handleLegend} thin>Symboler</SLButton>
      </div>
      <ModalDialog
        isOpen={legendOpen}
        onClose={() => setLegendOpen(false)}
        title={"Symboler"}
      >
        <Legend legendData={symbols} title="Linjesymbol" useColumns />
        <Legend legendData={destinations} title="Destination" />
      </ModalDialog>
      <ModalDialog
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
        title={"Response Data"}
        scrollable={true}
      >
        <pre>
          {JSON.stringify(departures,null, 2)}
        </pre>
      </ModalDialog>
    </Card>
  )
}

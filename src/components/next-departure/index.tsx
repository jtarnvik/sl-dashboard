import {useCallback, useEffect, useImperativeHandle, useState} from "react";
import axios from 'axios';
import {SITE_SKOGSLOPARVAGEN_4_CHAR, URL_GET_DEPARTURES_FROM_SITE} from "../../communication/constant.ts";
import {DateTime, Duration} from "luxon";
import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../util/sorters.ts";
import {useVisibility} from "../../hook/use-visibility.ts";
import {Line} from "../common/line";
import {Card} from "../common/card";

import "./index.css"
import {Destination} from "./destination.tsx";
import {SLButton} from "../common/sl-button";
import {ModalDialog} from "../common/modal-dialog";
import {destinations, symbols} from "./legend-data.tsx";
import {Legend} from "./legend.tsx";

type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>;
}

export function NextDeparture({performManualUpdate}: Props) {
  const [departures, setDepartures] = useState<SlDeparturesResponse | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<DateTime | undefined>(undefined);
  const [diffSinceLastUpdated, setDiffSinceLastUpdated] = useState<Duration | undefined>(undefined);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  const updateDiffSinceLatUpdated = useCallback(() => {
    setDiffSinceLastUpdated(lastUpdated?.diffNow())
  }, [lastUpdated]);

  const updateDepartures = useCallback(() => {
    const url = URL_GET_DEPARTURES_FROM_SITE(SITE_SKOGSLOPARVAGEN_4_CHAR);
    axios.get(url)
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
        // always executed
      });
  }, []);

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
              <Line line={departure.line} journey={departure.journey} />
            </div>
            <div className="grid-name">
              <Destination journey={departure.journey} destination={departure.destination} />
            </div>
            <div className="grid-time justify-self-end">
              {departure.display}
            </div>
          </div>
        )}
      <div className="w-full flex justify-end">
        <SLButton onClick={handleLegend} thin>Symboler</SLButton>
      </div>
      <ModalDialog
        isOpen={legendOpen}
        onClose={() => setLegendOpen(false)}
        title={"Symboler"}
      >
        <Legend legendData={symbols} title="Linjesymbol" useColumns/>
        <Legend legendData={destinations} title="Destination" />
      </ModalDialog>
    </Card>
  )
}

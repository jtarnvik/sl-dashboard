import {useCallback, useEffect, useImperativeHandle, useState} from "react";
import axios from 'axios';
import {SITE_SKOGSLOPARVAGEN_4_CHAR, URL_GET_DEPARTURES_FROM_SITE} from "../../communication/constant.ts";
import {DateTime, Duration} from "luxon";
import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../util/sorters.ts";
import {useVisibility} from "../../hook/use-visibility.ts";
import "./index.scss"
import {Line} from "./line.tsx";

export interface TrainScheduleHandle {
  manualUpdate: () => void;
}

type Props = {
  performManualUpdate?: React.Ref<TrainScheduleHandle>;
}

export function NextDeparture({performManualUpdate}: Props) {
  const [departures, setDepartures] = useState<SlDeparturesResponse | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<DateTime | undefined>(undefined);
  const [diffSinceLastUpdated, setDiffSinceLastUpdated] = useState<Duration | undefined>(undefined);

  const updateDiffSinceLatUpdated = useCallback(() => {
    console.log("Diff updaterad")
    setDiffSinceLastUpdated(lastUpdated?.diffNow())
  }, [lastUpdated]);

  const updateDepartures = useCallback(() => {
    const url = URL_GET_DEPARTURES_FROM_SITE(SITE_SKOGSLOPARVAGEN_4_CHAR);
    axios.get(url)
      .then(function (response) {
        setDepartures(response.data);
        setLastUpdated(DateTime.now());
        setDiffSinceLastUpdated(DateTime.now().diffNow())

        console.log(response);
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
    const intervalId = setInterval(updateDiffSinceLatUpdated, 5 * 1000);
    return () => clearInterval(intervalId);
  }, [updateDiffSinceLatUpdated]);

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  const departurePres: Departure[] = sortDeparturesByDestination(departures?.departures);

  return (
    <div>
      {/* TODO: create a separate component for the card */}
      <div className="block max-w p-4 mx-2 bg-[#F1F2F3] border border-gray-200 rounded-lg shadow-sm">
        <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 ">Avgångar Skogslöparvägen</h5>
        <div className="font-normal text-gray-700 ">
          Table header
          {departurePres.length > 0 &&
            departurePres.map((departure, index) =>
              <div key={index}
              className="departures-grid">
                <Line line={departure.line} />
                <div className="grid-name">{departure.destination}</div>
                <div className="grid-time justify-self-end">{departure.display}</div>
              </div>
            )}
        </div>
      </div>
      <div>
        <p>Number of Departures: {departurePres.length}</p>
        <p>Last updated: {lastUpdated?.toISOTime()}</p>
        <p>Time since last
          update {((diffSinceLastUpdated) ? shortSwedishHumanizer(diffSinceLastUpdated?.toMillis()) : "-")}</p>
      </div>
    </div>
  )
}

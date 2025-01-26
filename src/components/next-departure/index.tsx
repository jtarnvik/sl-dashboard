import {useCallback, useEffect, useImperativeHandle, useState} from "react";
import axios from 'axios';
import {SITE_SKOGSLOPARVAGEN_4_CHAR, URL_GET_DEPARTURES_FROM_SITE} from "../../communication/constant.ts";
import {DateTime, Duration} from "luxon";
import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {sortDeparturesByDestination} from "../../util/sorters.ts";
import {Departure} from "./departure.tsx";

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

  const updateDiffsInceLatUpdated = useCallback(() => {
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

  function manualUpdate() {
    updateDepartures();
  }

  useEffect(() => {
    updateDepartures();
    const intervalId = setInterval(updateDepartures, 600 * 1000);
    return () => clearInterval(intervalId);
  }, [updateDepartures]);

  useEffect(() => {
    const intervalId = setInterval(updateDiffsInceLatUpdated, 5 * 1000);
    return () => clearInterval(intervalId);
  }, [updateDiffsInceLatUpdated]);

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  const departurePres: Departure[] = sortDeparturesByDestination(departures?.departures);

  return (
    <div>
      <strong>Next Departure</strong>
      <div>DepartureHeader</div>
      {departurePres.length > 0 &&
        departurePres.map(departure => <Departure departure={departure} />)
      }
      <div>
        <p>Number of Departures: {departurePres.length}</p>
        <p>Last updated: {lastUpdated?.toISOTime()}</p>
        <p>Time since last update {((diffSinceLastUpdated) ? shortSwedishHumanizer(diffSinceLastUpdated?.toMillis()) : "-")}</p>
      </div>
    </div>
  )
}

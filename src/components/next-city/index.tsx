import {useCallback, useImperativeHandle} from "react";
import {Card} from "../common/card";
import {
  SITE_SKOGSLOPARVAGEN_4_CHAR,
  SITE_SKOGSLOPARVAGEN_9_CHAR,
  SITE_SPANGA_9_CHAR,
  URL_GET_TRAVEL_FROM_TO
} from "../../communication/constant.ts";
import axios from "axios";

type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>;
}

export function NextCity({performManualUpdate}: Props) {
  const updateDepartures = useCallback(() => {
    const url = URL_GET_TRAVEL_FROM_TO(SITE_SKOGSLOPARVAGEN_9_CHAR, SITE_SKOGSLOPARVAGEN_4_CHAR, SITE_SPANGA_9_CHAR);
    axios.get(url)
      .then(function (response) {
        // setDepartures(response.data);
        // setLastUpdated(DateTime.now());
        // setDiffSinceLastUpdated(DateTime.now().diffNow())

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

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  return (
    <Card>
      NextToCity
    </Card>);
}
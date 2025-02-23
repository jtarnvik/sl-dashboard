import {useCallback, useImperativeHandle, useState} from "react";
import {Card} from "../common/card";
import {
  SITE_CENTRALEN_9_CHAR,
  SITE_SKOGSLOPARVAGEN_9_CHAR,
  URL_GET_TRAVEL_FROM_TO
} from "../../communication/constant.ts";
import axios from "axios";
import {Button} from "@headlessui/react";

type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>;
}

export function NextCity({performManualUpdate}: Props) {
  const [response, setResponse] = useState<string>("");

  const updateDepartures = useCallback(() => {
    setResponse("Loading...");
    const url = URL_GET_TRAVEL_FROM_TO(SITE_SKOGSLOPARVAGEN_9_CHAR, SITE_CENTRALEN_9_CHAR);
    axios.get(url)
      .then(function (response) {
        // setDepartures(response.data);
        // setLastUpdated(DateTime.now());
        // setDiffSinceLastUpdated(DateTime.now().diffNow())

        console.log(response);
        setResponse("OK: " + response.data);
      })
      .catch(function (error) {
        // TODO: Log error
        // handle error
        console.log(error);
        setResponse("Error: " + error);
      })
      .finally(function () {
        // always executed
      });
  }, []);


  function manualUpdate() {
    // updateDepartures();
  }

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  function tempButtonUpdate() {
    updateDepartures();
  }

  return (
    <Card>
      NextToCity
      <p/>
      <Button onClick={tempButtonUpdate}
              className="rounded bg-[#184fc2] p-[6px] text-sm text-white data-[hover]:bg-[#578ff3] data-[active]:bg-[#578ff3] focus:outline-none "
      >Tryit</Button>
      <p/>
      {response}

    </Card>);
}
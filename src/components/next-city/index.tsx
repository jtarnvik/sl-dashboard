import {useCallback, useImperativeHandle, useState} from "react";
import {Card} from "../common/card";
import {
  SITE_CENTRALEN_16_CHAR,
  SITE_SKOGSLOPARVAGEN_16_CHAR,
  URL_GET_TRAVEL_FROM_TO_v2
} from "../../communication/constant.ts";
import axios from "axios";
import {Button} from "@headlessui/react";
import {Journey, SystemMessage} from "../../types/sl-journeyplaner-responses";
import {SldJourney} from "./sld-journey.tsx";

type Props = {
  performManualUpdate?: React.Ref<ScheduleOperations>;
}

export function NextCity({performManualUpdate}: Props) {
  const [journeys, setJourneys] = useState<Journey[] | undefined>(undefined);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[] | undefined>(undefined)
  const [response, setResponse] = useState<string>("");

  const updateDepartures = useCallback(() => {
    setResponse("Loading...");
    const url = URL_GET_TRAVEL_FROM_TO_v2(SITE_SKOGSLOPARVAGEN_16_CHAR, SITE_CENTRALEN_16_CHAR);
    axios.get(url)
      .then(function (response) {
        setJourneys(response.data.journeys);
        setSystemMessages(response.data.systemMessages);
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
      <p />
      <Button onClick={tempButtonUpdate}
              className="rounded bg-[#184fc2] p-[6px] text-sm text-white data-[hover]:bg-[#578ff3] data-[active]:bg-[#578ff3] focus:outline-none "
      >Tryit</Button>
      <p />
      {journeys &&
        <div>
          {journeys.map((journey, index) => {
            return (
              <div key={index}>
                <SldJourney journey={journey}  />
              </div>
            )
          })
          }
        </div>
      }

    </Card>);
}
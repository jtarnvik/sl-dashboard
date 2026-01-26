import { useImperativeHandle, useState} from "react";
import {Card} from "../common/card";
import {
  URL_GET_TRAVEL_COORD_TO_v2,
} from "../../communication/constant.ts";
import axios from "axios";
import {Button} from "@headlessui/react";
import {Journey, SystemMessage} from "../../types/sl-journeyplaner-responses";
import {SldJourney} from "./sld-journey.tsx";

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
  performManualUpdate?: React.Ref<ScheduleOperations>,
  settingsData: SettingsData
}

export function NextCity({performManualUpdate, settingsData}: Props) {
  const [journeys, setJourneys] = useState<Journey[] | undefined>(undefined);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[] | undefined>(undefined)
  const [response, setResponse] = useState<string>("");

  const [location, setLocation] = useState<Location | undefined >(undefined);
  const [geoInfo, setGeoInfo] = useState<string | undefined>(undefined);
  const [routePlanningInProgress, setRoutePlanningInProgress] = useState<boolean>(false);
  const [state, setState] = useState<string>("");

  if (false) {
    console.log(systemMessages);
    console.log(response);
    console.log(location);
    console.log(routePlanningInProgress);
  }

  function updateDepartures() {
    function generateRoute(lat:number, long:number){
      setState("Generating route...");
      const url = URL_GET_TRAVEL_COORD_TO_v2(long, lat, settingsData.stopPointId);
      axios.get(url)
        .then(function (response) {
          setJourneys(response.data.journeys);
          setSystemMessages(response.data.systemMessages);
          setState("route fetched - presenting")
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
    }

    setRoutePlanningInProgress(true);
    setLocation(undefined);
    setGeoInfo(undefined);
    setJourneys(undefined);
    setSystemMessages(undefined);

    setState("Planning route...");
    if (!navigator.geolocation) {
      setGeoInfo('Geolocation is not supported by your browser');
      setRoutePlanningInProgress(false);
      setState("Geolocation is not supported by your browser");
      return;
    }

    // Get current position once
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,    // 59,....
          longitude: position.coords.longitude,  // 17,....
          accuracy: position.coords.accuracy, // in meters
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
        setRoutePlanningInProgress(false);
        console.log("position", position);
        setState("Route planned, geolocation received.");
        generateRoute(position.coords.latitude, position.coords.longitude);
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
      {state}
      {geoInfo ?
        <div>
          {geoInfo}
        </div>
        :
        <div>
          <p />
          {journeys &&
            <div>
              {journeys.map((journey, index) => {
                return (
                  <div key={index}>
                    <SldJourney journey={journey} />
                  </div>
                )
              })
              }
            </div>
          }
        </div>
      }
    </Card>);
}
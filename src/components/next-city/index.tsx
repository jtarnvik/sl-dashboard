import {useEffect, useImperativeHandle, useRef, useState} from "react";
import {Card} from "../common/card";
import {
  URL_GET_TRAVEL_COORD_TO_v2,
} from "../../communication/constant.ts";
import axios from "axios";
import {Journey, SystemMessage} from "../../types/sl-journeyplaner-responses";
import {SldJourney} from "./sld-journey.tsx";
import {AbortControllerState, createAbortController, isAbortError} from "../../types/communication.ts";
import {SLButton} from "../common/sl-button";

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
  const latestRequest = useRef<AbortControllerState | undefined>(undefined);

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

  useEffect(() => {
    setLocation(undefined);
    setGeoInfo(undefined);
    setJourneys(undefined);
    setSystemMessages(undefined);
    setState("");
  }, [settingsData])

  useEffect(() => {
    return () => latestRequest.current?.abort("Component unmounted");
  }, []);

  function updateDepartures() {
    function generateRoute(lat:number, long:number){
      if (latestRequest.current) {
        latestRequest.current.abort("Previous request contains stale data");
      }

      const controller = createAbortController();
      latestRequest.current = controller;

      const url = URL_GET_TRAVEL_COORD_TO_v2(long, lat, settingsData.stopPointId);
      axios.get(url, {
        signal: controller.signal,
      })
        .then(function (response) {
          setJourneys(response.data.journeys);
          setSystemMessages(response.data.systemMessages);
          if (!response.data.journeys) {
            setState("No routes, are you already there?")
          }
          console.log("journey", response.data);
        })
        .catch(function (error) {
          // Treat aborts as "expected"
          if (isAbortError(error)) {
            return;
          }

          console.log(error);
          setResponse("Error: " + error);
        })
        .finally(function () {
          // Clear ONLY if this request is still the latest one
          if (latestRequest.current === controller) {
            latestRequest.current = undefined;
          }
        });
    }

    setRoutePlanningInProgress(true);
    setLocation(undefined);
    setGeoInfo(undefined);
    setJourneys(undefined);
    setSystemMessages(undefined);

    if (!navigator.geolocation) {
      setGeoInfo('Geolocation is not supported by your browser');
      setRoutePlanningInProgress(false);
      return;
    }

    // Get current position once
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,    // 59,....
          longitude: position.coords.longitude,  // 17,....
          accuracy: position.coords.accuracy,    // in meters
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
        setRoutePlanningInProgress(false);
        console.log("position", position);
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
      Ta mig <SLButton onClick={tempButtonUpdate} thin>hem</SLButton>
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
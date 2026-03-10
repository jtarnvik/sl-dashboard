import {useContext, useEffect, useRef, useState} from "react";
import {URL_GET_TRAVEL_COORD_TO_v2} from "../../../communication/constant.ts";
import {fetchAbortable} from "../../../communication/fetch-abortable.ts";
import {Card} from "../../common/card";
import {SLButton} from "../../common/sl-button";
import {SldJourney} from "./sld-journey.tsx";
import {AbortControllerState} from "../../../types/communication.ts";
import {Journey, SystemMessage} from "../../../types/sl-journeyplaner-responses";
import ErrorContext from "../../../contexts/error-context.ts";

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
  settingsData: SettingsData
}

export function Routes({settingsData}: Props) {
  const {setError} = useContext(ErrorContext);
  const latestRequest = useRef<AbortControllerState | undefined>(undefined);

  const [journeys, setJourneys] = useState<Journey[] | undefined>(undefined);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[] | undefined>(undefined)

  const [location, setLocation] = useState<Location | undefined>(undefined);
  const [geoInfo, setGeoInfo] = useState<string | undefined>(undefined);
  const [routePlanningInProgress, setRoutePlanningInProgress] = useState<boolean>(false);
  const [state, setState] = useState<string>("");

  if (false) {
    console.log(systemMessages);
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

  function updateDepartures(maxWalk: number) {
    function generateRoute(lat: number, long: number, maxInitialWalkTime: number) {
      const url = URL_GET_TRAVEL_COORD_TO_v2(long, lat, settingsData.stopPointId, maxInitialWalkTime);
      fetchAbortable<{journeys: Journey[], systemMessages: SystemMessage[]}>(url, latestRequest, (data) => {
        setJourneys(data.journeys);
        setSystemMessages(data.systemMessages);
        if (!data.journeys) {
          setState("No routes, are you already there?")
        }
      }, setError);
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
        generateRoute(position.coords.latitude, position.coords.longitude, maxWalk);
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

  function tempButtonUpdate(maxWalk: number) {
    updateDepartures(maxWalk);
  }

  return (
    <Card>
      Ta mig hem <SLButton onClick={() => tempButtonUpdate(15)} thin>15 min</SLButton>&nbsp;
      <SLButton onClick={() => tempButtonUpdate(60)} thin>60 min</SLButton> Max promenadtid
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
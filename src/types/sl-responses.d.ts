type JourneyState =
  | "NOTEXPECTED" // Do not show departure at all. Some systems might instead indicate that this departure is available only if ordered.
  | "NOTRUN" // If a not expected dated vehicle journey is never run, it should at some point in time be considered as not run.
  | "EXPECTED" // Normally show target time for departure.
  | "ASSIGNED" // A symbol or text indicating that the vehicle journey is not yet in progress could be added depending on presentation system configuration.
  | "CANCELLED" // Show departure as cancelled.
  | "SIGNEDON" // If the presentation system only shows vehicles that are in progress, do not show the departure.
  | "ATORIGIN" // Normally show target time for departure. A symbol or text indicating that the vehicle journey is at origin, but not yet in progress could be added.
  | "FASTPROGRESS" // Present the current vehicle journey position, i.e., "has left station X Z minutes ago" or "currently at station Y". Use a symbol if text size is limited.
  | "NORMALPROGRESS" // Present the current vehicle journey position, i.e., "has left station X Z minutes ago" or "currently at station Y".
  | "SLOWPROGRESS" // Present the current vehicle journey position and add information that "traffic moves slowly". Use a symbol if text size is limited.
  | "NOPROGRESS" // Present the current vehicle journey position and inform that there is a "stop in traffic". Use a symbol if text size is limited.
  | "OFFROUTE" // If the vehicle system detects that a vehicle is not following the expected route, it can change the state to off route.
  | "ABORTED" // If the vehicle finally reaches its destination, the state becomes completed. Otherwise, it is aborted.
  | "COMPLETED" // If the vehicle reaches its destination, the vehicle journey receives the state completed.
  | "ASSUMEDCOMPLETED"; // If an expected vehicle journey is not cancelled and never becomes in progress, it should eventually be considered as assumed completed.

type JourneyPredictState =
  | "NORMAL"
  | "LOSTCONTACT"
  | "UNRELIABLE";

type JourneyPassengerLevel =
  | "EMPTY"
  | "SEATSAVAILABLE"
  | "STANDINGPASSENGERS"
  | "PASSENGERSLEFTBEHIND"
  | "UNKNOWN"

interface Journey {
  id: number;
  state: JourneyState;                      // Verified
  prediction_state?: JourneyPredictState;   // Verified
  passenger_level?: JourneyPassengerLevel;  // Verified
}

type StopAreaType =
  | "BUSTERM"
  | "METROSTN"
  | "TRAMSTN"
  | "RAILWSTN"
  | "SHIPBER"
  | "FERRYBER"
  | "AIRPORT"
  | "TAXITERM"
  | "UNKNOWN";

interface StopArea {
  id: number;
  name: string; // e.g., "Abborrkroksvägen"
  sname?: string; // Optional short name, e.g., "string"
  type: StopAreaType;                       // Verified
}

interface StopPoint {
  id: number;
  name: string; // e.g., "Universitetet"
  designation?: string; // Optional, e.g., "D", "1"
}

type TransportMode = "BUS" | "TRAM" | "METRO" | "TRAIN" | "FERRY" | "SHIP" | "TAXI";
interface Line {
  id: number;
  designation: string; // e.g., "13X", "17"
  transport_mode: TransportMode;            // Verofied
  group_of_lines?: string; // Optional, e.g., "Tunnelbanans gröna linje"
}

interface Deviation {
  importance_level: number; // e.g., 5
  consequence?: string; // Optional, e.g., "INFORMATION"
  message: string; // e.g., "Resa förbi Arlanda C kräver både UL- och SL- biljett."
}

interface Scope {
  lines?: Line; // Optional, scope can include line-specific details
  stop_areas?: StopArea; // Optional, scope can include specific stop areas
  stop_points?: StopPoint; // Optional, scope can include specific stop points
}

interface StopDeviation {
  id: number; // e.g., 26170662
  importance_level: number; // e.g., 5
  message: string; // e.g., "Tack för att du följer Folkhälsomyndighetens rekommendationer..."
  scope?: Scope; // Optional, includes details on affected lines, stop areas, or stop points
}

type DepartureState =
  | "NOTEXPECTED"
  | "NOTCALLED"
  | "EXPECTED"
  | "CANCELLED"
  | "INHIBITED"
  | "ATSTOP"
  | "BOARDING"
  | "BOARDINGCLOSED"
  | "DEPARTED"
  | "PASSED"
  | "MISSED"
  | "REPLACED"
  | "ASSUMEDDEPARTED";

interface Departure {
  destination: string; // e.g., "string"
  direction_code: number; // e.g., 2
  direction: string; // e.g., "string"
  via?: string; // Optional, e.g., "string"
  state: DepartureState;                    // Verified
  scheduled: string; // ISO 8601 format
  expected: string; // ISO 8601 format
  display: string; // e.g., "string"
  journey: Journey;
  stop_area: StopArea;
  stop_point: StopPoint;
  line: Line;
  deviations: Deviation[]; // Now explicitly an array of deviation objects
}

interface SlDeparturesResponse {
  departures: Departure[];
  stop_deviations: StopDeviation[];
}

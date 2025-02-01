interface Journey {
  id: number;
  state: string; // e.g., "NOTEXPECTED"
  prediction_state?: string; // Optional, e.g., "NORMAL"
  passenger_level?: string; // Optional, e.g., "EMPTY"
}

interface StopArea {
  id: number;
  name: string; // e.g., "Abborrkroksvägen"
  sname?: string; // Optional short name, e.g., "string"
  type: string; // e.g., "BUSTERM", "METROSTN"
}

interface StopPoint {
  id: number;
  name: string; // e.g., "Universitetet"
  designation?: string; // Optional, e.g., "D", "1"
}

interface Line {
  id: number;
  designation: string; // e.g., "13X", "17"
  transport_mode: string; // BUS, TRAM, METRO, TRAIN, FERRY, SHIP, TAXI
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

interface Departure {
  destination: string; // e.g., "string"
  direction_code: number; // e.g., 2
  direction: string; // e.g., "string"
  via?: string; // Optional, e.g., "string"
  state: string; // e.g., "NOTEXPECTED"
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

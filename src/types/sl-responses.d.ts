interface Journey {
  id: number;
  state: string;
  prediction_state?: string; // Optional
  passenger_level?: string; // New field: e.g., "EMPTY"
}

interface StopArea {
  id: number;
  name: string;
  sname?: string; // Short name, optional
  type: string; // e.g., "BUSTERM"
}

interface StopPoint {
  id: number;
  name: string;
  designation?: string; // Optional: e.g., "D"
}

interface Line {
  id: number;
  designation: string; // e.g., "13X"
  transport_mode: string; // e.g., "BUS"
  group_of_lines?: string; // Optional: e.g., "tunnelbanans gröna linje"
}

interface Deviation {
  importance?: number; // Optional: e.g., 5
  consequence?: string; // Optional: e.g., "INFORMATION"
  message?: string; // Optional: e.g., "Resa förbi Arlanda C kräver både UL- och SL- biljett."
}

interface Departure {
  destination: string;
  direction_code: number;
  direction: string;
  via?: string; // Optional: additional information about the route
  state: string; // e.g., "EXPECTED", "NOTEXPECTED"
  scheduled: string; // ISO 8601 format
  expected: string; // ISO 8601 format
  display: string; // e.g., "1 min"
  journey: Journey;
  stop_area: StopArea;
  stop_point: StopPoint;
  line: Line;
  deviations: Deviation[] | string; // Can be an array of deviations or a string
}

interface StopDeviation {
  importance: number; // e.g., 5
  consequence: string; // e.g., "INFORMATION"
  message: string; // e.g., "Resa förbi Arlanda C kräver både UL- och SL- biljett."
}

interface Response {
  departures: Departure[];
  stop_deviations: StopDeviation[];
}

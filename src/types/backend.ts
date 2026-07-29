export interface RecentStop {
  stopPointId: string;
  stopPointName: string;
  stopPointParentName?: string;
}

export interface UserSettings {
  stopPointId: string;
  stopPointName: string;
  useAiInterpretation: boolean;
  recentStops?: RecentStop[];
}

export interface User {
  email: string;
  name: string;
  picture: string;
  role?: string;
  settings?: UserSettings | null;
}

export interface UserRowItem {
  id: number;
  email: string;
  name: string;
  createDate: string;
  role?: string | null;
  message?: string | null;
  lastLogin?: string | null;
}

export interface AccessRequestItem extends UserRowItem {
  message: string | null;
}

export interface AllowedUserItem extends UserRowItem {
  role: string | null;
  lastLogin: string | null;
}

export interface StatisticsData {
  routesShared: number;
  aiInterpretationQueries: number;
  userCount: number;
}

export interface MonitoredRouteGroup {
  transportMode: string;
  routeGroup: number;
  displayName: string;
  focusStart: string | null;
  focusEnd: string | null;
  onlyFocused: boolean;
}

export interface GtfsDataStatus {
  date: string | null;
  status: string | null;
  staticDataAvailable: boolean;
}

/** One stop in a route group's canonical chain. Always a parent station, never a platform. */
export interface LiveStop {
  stopId: string;
  stopName: string;
  shapeDistTraveled: number | null;
}

/**
 * The route group's canonical stop chain, sent once per response. Normalized to one direction: a vehicle
 * whose `directionId` equals `direction` travels from `stops[0]` towards the end, one that differs runs the
 * chain backwards.
 */
export interface LiveTrip {
  direction: number;
  stopHeading: string;
  stops: LiveStop[];
}

/**
 * One vehicle, placed on the chain: it is between `stops[segIdx]` and `stops[segIdx + 1]`,
 * `segmentFraction` (0..1) of the way along that segment. `distanceMetres` is how far the vehicle really is
 * from that segment — a large value means the geometric match is poor.
 */
export interface LiveVehicle {
  vehicleId: string;
  tripId: string;
  /** Where this vehicle terminates — its own trip's destination, so short turns are reported correctly. */
  destination: string | null;
  lat: number;
  lng: number;
  bearing: number;
  timestamp: number;
  directionId: number;
  segIdx: number;
  segmentFraction: number;
  distanceMetres: number;
}

/**
 * How a focused chain terminates, and what is waiting beyond it. Null when the view is not focused.
 *
 * A truncated end means the line continues past the stops that were sent — draw a "continues here" marker
 * rather than an end of line. The counts are of *approaching* vehicles only, so zero means nothing is on its
 * way in, not that nothing is out there.
 */
export interface RouteFocus {
  truncatedStart: boolean;
  truncatedEnd: boolean;
  approachingAtStart: number;
  approachingAtEnd: number;
}

export interface RouteData {
  status: string;
  liveTrip: LiveTrip | null;
  vehicles: LiveVehicle[];
  focus: RouteFocus | null;
}

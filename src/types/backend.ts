export interface RecentStop {
  stopPointId: string;
  stopPointName: string;
  stopPointParentName?: string;
}

/**
 * A stop the user wants emphasised on the live traffic schematic. `stopId` is a GTFS parent station id,
 * matching `LiveStop.stopId` — note this is a different namespace from `UserSettings.stopPointId`, which is
 * an SL journey planner site id. The name is stored so the settings dialog can render a selection even when
 * the GTFS dataset is unavailable.
 */
export interface FavouriteStop {
  stopId: string;
  stopName: string;
}

/**
 * What the live traffic view was showing last, so it can restore itself instead of always falling back to
 * bus 117. `focused` is null when the user has never operated the focus switch — that is not the same as
 * false, which would mean they deliberately turned it off.
 */
export interface LiveTrafficView {
  transportMode: string;
  routeGroup: number;
  focused: boolean | null;
}

export interface UserSettings {
  stopPointId: string;
  stopPointName: string;
  useAiInterpretation: boolean;
  recentStops?: RecentStop[];
  favouriteStops?: FavouriteStop[];
  liveTrafficView?: LiveTrafficView | null;
}

/** One pickable stop in the favourites catalogue. Structurally like FavouriteStop but a separate contract. */
export interface SelectableStop {
  stopId: string;
  stopName: string;
}

/** The stops of one route group, for the favourites picker. A stop may appear in more than one group. */
export interface RouteGroupStops {
  transportMode: string;
  routeGroup: number;
  displayName: string;
  stops: SelectableStop[];
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
  /**
   * The group's line numbers, for deciding whether a line belongs to it. `displayName` is these joined.
   *
   * Optional because a backend older than the field simply omits it, and the frontend deploys independently
   * — a dev server pointed at production is the everyday case. Absent means no line matches, so the rows
   * are inert until the backend catches up, rather than the pane crashing.
   */
  lines?: string[];
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
 * When a vehicle is due to leave one stop of the chain, as epoch *seconds*. Absolute rather than a
 * countdown because the view polls every 8 seconds and counts down locally in between.
 *
 * `stopId` is a parent station id, so it matches `LiveStop.stopId` directly.
 */
export interface StopPrediction {
  stopId: string;
  departure: number;
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
  /**
   * When this vehicle is due to leave each chain stop still ahead of it, in the order it reaches them.
   * Stops its own trip does not call at are absent, so a short turn stops predicting at its real terminus.
   *
   * Optional for the same reason as `MonitoredRouteGroup.lines`: a backend older than the field omits it,
   * and then there are simply no countdowns to draw.
   */
  stopPredictions?: StopPrediction[];
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

/**
 * How an attempt to find the live vehicle behind a departure row ended. Only `MATCHED` carries a trip id;
 * the rest are notes to show beside a view that still works, since the line is shown either way.
 *
 * `NO_MATCH` is ordinary rather than exceptional — SL shows a journey as running slightly before the vehicle
 * appears in the realtime feed.
 */
export type ResolveOutcome = "MATCHED" | "NO_MATCH" | "AMBIGUOUS" | "NO_LIVE_DATA";

export interface ResolvedTrip {
  outcome: ResolveOutcome;
  tripId: string | null;
  vehicleId: string | null;
}

/** A departure row expressed as the content key that identifies it in GTFS. See the backend `TripQuery`. */
export interface TripQuery {
  transportMode: string;
  routeGroup: number;
  line: string;
  stopAreaId: number;
  stopAreaName: string;
  scheduled: string;
  destination: string;
}

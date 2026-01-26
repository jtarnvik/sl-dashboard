export interface JourneyPlannerTripsResponse {
  systemMessages: SystemMessage[];
  journeys: Journey[];
}

export interface SystemMessage {
  type?: string;
  code?: string | number;
  module?: string;
  text?: string;
}

export interface Journey {
  tripDuration: number;             // seconds
  tripRtDuration: number;           // realtime adjusted duration (seconds)
  rating: number;
  isAdditional: boolean;
  interchanges: number;
  legs: Leg[];
}

export interface Leg {
  infos: InfoMessage[];
  duration: number;                 // seconds
  origin: StopPoint;
  destination: StopPoint;

  transportation?: Transportation;  // not present for pure walking legs
  footPathInfo?: FootPathInfo[];    // present for walking legs

  stopSequence?: StopPoint[];
  coords?: Coordinate[][];
  realtimeStatus?: RealtimeStatus[];
  isRealtimeControlled?: boolean;

  properties?: {
    tripId?: string;
  };
}

export interface StopPoint {
  isGlobalId: boolean;
  id: string;
  name: string;
  disassembledName?: string;
  type: StopPointType;
  coord: Coordinate;
  niveau?: number;

  parent?: StopParent;

  productClasses?: number[];

  departureTimeBaseTimetable?: ISODateTime;
  departureTimePlanned?: ISODateTime;
  departureTimeEstimated?: ISODateTime;

  arrivalTimeBaseTimetable?: ISODateTime;
  arrivalTimePlanned?: ISODateTime;
  arrivalTimeEstimated?: ISODateTime;

  properties?: Record<string, any>;
}

export interface StopParent {
  isGlobalId?: boolean;
  id: string;
  name: string;
  disassembledName?: string;
  type: StopPointType;
  parent?: StopParent;
  properties?: Record<string, any>;
  coord?: Coordinate;
  niveau?: number;
}

export interface Transportation {
  id?: string;
  name?: string;
  number?: string;
  disassembledName?: string;

  product: Product;
  operator?: Operator;
  destination?: TransportationDestination;

  properties?: TransportationProperties;

  isSamtrafik: boolean;
}

// Typical classes:
// 0 = Train
// 3 = Bus
// 5 = Bus (local)
// 99 = Footpath

export const PRODUCT_CLASS_TRAIN = 0;
export const PRODUCT_CLASS_SUBWAY = 2;
export const PRODUCT_CLASS_BUS = 3;
export const PRODUCT_CLASS_BUS_LOCAL = 5;
export const PRODUCT_CLASS_FOOTPATH = 99;
export const PRODUCT_CLASS_FOOTPATH_2 = 100;


export interface Product {
  id?: number;
  class: number;
  name: string;
  iconId: number;
}

export function isFootPath(product:Product) {
  return product.class === PRODUCT_CLASS_FOOTPATH || product.class === PRODUCT_CLASS_FOOTPATH_2;
}

export interface Operator {
  id: string;
  name: string;
}

export interface TransportationDestination {
  id: string;
  name: string;
  type: StopPointType;
}

export interface TransportationProperties {
  tripCode?: number;
  timetablePeriod?: "Current" | string;
  lineDisplay?: string;
  globalId?: string;
  RealtimeTripId?: string;
  shortTrain?: boolean;
  AVMSTripID?: string;
}

export interface FootPathInfo {
  duration: number;
  position: "IDEST" | string;
  footPathElem: FootPathElement[];
}

export interface FootPathElement {
  type: "UNKNOWN" | string;
  description: string;

  origin: FootPathStop;
  destination: FootPathStop;

  level: "LEVEL" | string;
  levelFrom: number;
  levelTo: number;

  attributes: FootPathAttributes;
  openingHours: any[];
}

export interface FootPathStop {
  id: string;
  isGlobalId: boolean;
  name: string;
  type: StopPointType;
  coord: Coordinate;
  properties?: Record<string, any>;
}

export interface FootPathAttributes {
  distance: number;         // meters
  duration: number;         // seconds
  maxStepHeight: number;
  numberSteps: number;
  narrowestWidth: number;
  rampInclination: number;
  rampLength: number;
  rampWidth: number;
  elevDoorWidth: number;
  elevLength: number;
  elevWidth: number;
}

export interface InfoMessage {
  priority?: number;
  text?: string;
}

export type Coordinate = [number, number]; // [lat, lon]

export type ISODateTime = string;

export type StopPointType =
  | "platform"
  | "stop"
  | "locality";

export type RealtimeStatus =
  | "MONITORED"
  | "UNMONITORED"
  | string;

export interface StopFinderResponse {
  locations: StopFinderLocation[];
  systemMessages?: SystemMessage[];
}

export interface StopFinderLocation {
  coord: Coordinate; // [lat, lon]
  disassembledName?: string;
  id: string;

  isBest?: boolean;
  isGlobalId?: boolean;

  matchQuality?: number;
  name: string;

  parent?: StopFinderParent;

  productClasses?: number[];

  properties?: StopFinderProperties;

  type: StopPointType; // typically "stop" (can also be "locality" depending on query)
}

export interface StopFinderParent {
  id: string;
  name: string;
  type: StopPointType; // e.g. "locality"
}

export interface StopFinderProperties {
  mainLocality?: string;
  stopId?: string;
}

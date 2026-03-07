/**
 * Transport mode types in the SL network
 */
export type TransportMode = 'BUS' | 'METRO' | 'TRAIN' | 'TRAM' | 'SHIP' | 'FERRY';

/**
 * Stop area type
 */
export type StopAreaType = 'METROSTN' | 'TRAMSTN' | 'BUSTERM' | 'RAILWSTN' | 'SHIPBER' | 'FERRYBER';

/**
 * Priority information for a deviation message
 * These fields are only used to sort messages and provide presentation hints
 */
export interface Priority {
  /** Sorting hint for message importance */
  importance_level: number;
  /** Indicates the number of people affected by the deviation */
  influence_level: number;
  /** Hint about message urgency speed */
  urgency_level: number;
}

/**
 * Publishing period for a deviation
 */
export interface Publish {
  /** Start datetime of the deviation */
  from: string;
  /** End datetime of the deviation */
  upto: string;
}

/**
 * Message variant containing localized deviation information
 */
export interface MessageVariant {
  /** Short message title */
  header: string;
  /** Full message description with detailed information about the deviation */
  details: string;
  /** Readable scope representation (e.g., "Buss 840", "Tunnelbana 17") */
  scope_alias: string;
  /** Message language code (e.g., "sv" for Swedish) */
  language: string;
  /** Optional related URL with additional information */
  weblink?: string;
}

/**
 * Affected transit line
 */
export interface Line {
  /** Line identifier */
  id: number;
  /** Transport authority identifier */
  transport_authority: number;
  /** Line designation as displayed to passengers */
  designation: string;
  /** Type of transport for this line */
  transport_mode: TransportMode;
  /** Optional group classification (e.g., "blåbuss", "Waxholmsbolaget") */
  group_of_lines?: string;
}

/**
 * Affected stop area
 */
export interface StopArea {
  /** Stop area identifier */
  id: number;
  /** Name of the stop area */
  name: string;
  /** Type of stop area */
  type: StopAreaType;
  /** Transport authority identifier */
  transport_authority: number;
}

/**
 * Scope of the deviation, indicating which lines and stop areas are affected
 */
export interface Scope {
  /** Affected transit lines */
  lines?: Line[];
  /** Affected stop areas */
  stop_areas?: StopArea[];
}

/**
 * Deviation message from the SL Deviations API
 * Represents a service disruption or planned change in the SL transit network
 */
export interface Deviation {
  /** Sequential message version number */
  version: number;
  /** Timestamp when the message was created */
  created: string;
  /** Timestamp when the message was last updated (optional) */
  modified?: string;
  /** Unique identifier for the deviation case */
  deviation_case_id: number;
  /** Publishing period for the deviation */
  publish: Publish;
  /** Priority information used for sorting and presentation */
  priority: Priority;
  /** Array of message translations and variants */
  message_variants: MessageVariant[];
  /** Scope indicating affected lines and stop areas */
  scope: Scope;
}

/**
 * Response from the GET /messages endpoint
 */
export type DeviationsResponse = Deviation[];

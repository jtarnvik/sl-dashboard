export const SITE_SKOGSLOPARVAGEN_4_CHAR = "3715";
export const SITE_SKOGSLOPARVAGEN_9_CHAR = "300103715";
export const SITE_SKOGSLOPARVAGEN_16_CHAR = "9091001000003715";
export const SITE_CENTRALEN_9_CHAR = "300109001";
export const SITE_CENTRALEN_16_CHAR = "9091001000009001";
export const SITE_SPANGA_9_CHAR = "301109704";
export const SITE_SPANGA_16_CHAR = "9091001001009704";
export const SITE_BROMMAPLAN_16_CHAR = "9091001000009109";
export const URL_GET_STOP_POINT = (term: string) => "https://journeyplanner.integration.sl.se/v2/stop-finder?name_sf=" + term + "&any_obj_filter_sf=2&type_sf=any" ;
export const URL_GET_DEPARTURES_FROM_SITE = (stop: string) => "https://transport.integration.sl.se/v1/sites/" + stop + "/departures";

export const URL_GET_DEVIATION_TRAIN = 'https://deviations.integration.sl.se/v1/messages?future=false&line=43&line=44&transport_mode=TRAIN';
export const URL_GET_DEVIATION_BUS = 'https://deviations.integration.sl.se/v1/messages?future=false&line=117&transport_mode=BUS';
export const URL_GET_DEVIATION_SUBWAY = 'https://deviations.integration.sl.se/v1/messages?future=false&line=17&line=18&line=19&transport_mode=METRO';

export const URL_BACKEND_GET_CHECK_AUTH = "/api/auth/me";
export const URL_BACKEND_LOGIN = "/oauth2/authorization/google";
export const URL_BACKEND_LOGOUT = "/api/auth/logout";
export const URL_BACKEND_ACCESS_REQUEST = "/api/public/access-request";
export const URL_BACKEND_VERSION = "/api/public/version";

export const URL_BACKEND_ADMIN_ACCESS_REQUESTS = "/api/admin/access-requests";
export const URL_BACKEND_ADMIN_ACCESS_REQUEST_COUNT = "/api/admin/access-requests/count";
export const URL_BACKEND_ADMIN_APPROVE_ACCESS_REQUEST = (id: number) => `/api/admin/access-requests/${id}/approve`;
export const URL_BACKEND_ADMIN_REJECT_ACCESS_REQUEST = (id: number) => `/api/admin/access-requests/${id}`;
export const URL_BACKEND_ADMIN_USERS = "/api/admin/users";
export const URL_BACKEND_ADMIN_DELETE_USER = (id: number) => `/api/admin/users/${id}`;
export const URL_BACKEND_ADMIN_STATISTICS = "/api/admin/statistics";

export const URL_BACKEND_SHARED_ROUTE_CREATE = "/api/protected/routes";
export const URL_BACKEND_SHARED_ROUTE_GET = (id: string) => `/api/public/routes/${id}`;

export const URL_BACKEND_GTFS_ROUTE_GROUPS = "/api/protected/gtfs/route-groups";
export const URL_BACKEND_GTFS_DATA_STATUS = "/api/protected/gtfs/status";
export const URL_BACKEND_GTFS_ROUTE_DATA = "/api/protected/gtfs/route-data";
export const URL_BACKEND_GTFS_ROUTE_GROUP_STOPS = "/api/protected/gtfs/route-group-stops";
export const URL_BACKEND_GTFS_RESOLVE_TRIP = "/api/protected/gtfs/resolve-trip";

export const URL_BACKEND_SETTINGS = "/api/protected/settings";
export const URL_BACKEND_RECENT_STOPS = "/api/protected/settings/recent-stops";
export const URL_BACKEND_LIVE_TRAFFIC_VIEW = "/api/protected/settings/live-traffic-view";
export const URL_BACKEND_FAVOURITE_STOPS = "/api/protected/settings/favourite-stops";
export const URL_BACKEND_DELETE_ACCOUNT = "/api/protected/account";
export const URL_BACKEND_INTERPRET_DEVIATIONS = "/api/protected/deviations/interpret";
export const URL_BACKEND_HIDE_DEVIATION = (id: number) => `/api/protected/deviations/${id}/hide`;
export const URL_BACKEND_CLEAR_HIDDEN_DEVIATIONS = "/api/protected/deviations/hidden";
export const URL_BACKEND_HAS_HIDDEN_DEVIATIONS = "/api/protected/deviations/hidden/exists";

export const DEFAULT_SETTINGS: SettingsData = { stopPointId: SITE_SKOGSLOPARVAGEN_16_CHAR, stopPointName: "Skogslöparvägen", useAiInterpretation: true };
export const STOP_HINT_KEY = "sl-dashboard-stop-hint";

// Mirrors MAX_FAVOURITE_STOPS in UserSettingsService — the backend is the enforcer, this is the affordance.
// Shared by the settings dialog and the live traffic schematic, which both offer to add a favourite: a cap
// that disagreed between them would let one of them add an eleventh that the backend then silently drops.
export const MAX_FAVOURITE_STOPS = 10;

// The application's public name, as shown in the browser tab title and the about dialog.
export const APP_NAME = "Nästa avgång";

// Contact address for data protection questions, published on the GDPR page — GDPR artikel 13 requires the
// controller to be reachable, so this has to be a real address rather than an invitation to "contact us".
// Deliberately a dedicated address and a single constant: it is on a public page and will be harvested, so
// replacing it must cost one line rather than a search through the views.
export const CONTACT_EMAIL = "sl@tarnvik.com";

// Focus stops for deviation filtering (StopArea.id from the deviations API).
// When non-empty, stop-specific deviations are only shown if their stop matches one of these IDs.
// Deviations with no stop scope (line-wide) are always shown.
// When empty, no stop filtering is applied and all deviations are shown.
export const DEVIATION_FOCUS_STOPS_TRAIN: number[] = [6041, 12138, 3431, 6031, 12346, 50242, 4543, 1131, 10151, 5320, 1051, 5011, 5901, 10291, 80055, 10910, 4301, 5300, 5310];
//                                                    Spånga,      Sundbyberg,                     Odenplan,          Centralen
export const DEVIATION_FOCUS_STOPS_SUBWAY: number[] = [1231, 12217, 15339, 1221, 12001, 1211, 12029, 12579, 1201, 4201, 4525, 12025, 1171, 10437, 1161, 12977, 17308, 1151, 10369, 1141, 10363, 1131, 10151, 5320, 10545, 1121, 1111, 10024, 11525, 1051, 5011, 5901, 10291, 80055, 10910, 4301, 5300, 5310, 1021, 10387, 8012];
//                                                     Brommaplan,         Abrahamsberg,Stora Mossen,       Alvik,                   Kristineb,   Thorildsplan,       Fridhemspla, St Erikspl,  Odenplan,          Rådmansgat,  Hötorget            T-Centralen                                              Gamla stan
export const DEVIATION_FOCUS_STOPS_BUS: number[] = [];

function createWGS84(lat: number, long: number) {
//  18.013809:59.335104:WGS84[dd.ddddd]
//  long     :lat      :WGS84[dd.ddddd]
  const fmt = (n: number) => (Object.is(n, -0) ? 0 : n).toFixed(5);
  return `${fmt(long)}:${fmt(lat)}:WGS84[dd.ddddd]`;
}

// The journey planner takes its origin either as a coordinate or as a stop id, and the two differ only in
// type_origin and the format of name_origin. Named members rather than positional lat/long arguments: the
// coordinate triple is written long-first, which the two previous builders got right only because each of
// them inverted the pair, cancelling the other out.
export type TripOrigin =
  | { kind: 'coord', lat: number, long: number }
  | { kind: 'stop', id: string };

export const URL_GET_TRAVEL_v2 = (origin: TripOrigin, dest: string, maxWalk: number, departureTime?: string, timeType?: 'dep' | 'arr', date?: string) =>
  "https://journeyplanner.integration.sl.se/v2/trips" +
  "?type_origin=" + (origin.kind === 'coord' ? "coord" : "any") +
  "&type_destination=any" +
  "&name_origin=" + (origin.kind === 'coord' ? createWGS84(origin.lat, origin.long) : origin.id) +
  "&name_destination=" + dest +
  "&calc_number_of_trips=3" +
  "&tr_it_mot_value100=" + maxWalk +
  (departureTime ? "&itd_time=" + departureTime + "&itd_trip_date_time_dep_arr=" + (timeType ?? 'dep') : "") +
  (date ? "&itd_date=" + date : "") +
  "&calc_one_direction=" + (departureTime && timeType === 'dep' ? "false" : "true")  // false = include one trip before specified departure time

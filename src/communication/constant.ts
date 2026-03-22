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
export const URL_BACKEND_NOTIFICATION_TEST = "/api/protected/notification/test";
export const URL_BACKEND_ACCESS_REQUEST = "/api/public/access-request";

export const URL_BACKEND_ADMIN_ACCESS_REQUESTS = "/api/admin/access-requests";
export const URL_BACKEND_ADMIN_APPROVE_ACCESS_REQUEST = (id: number) => `/api/admin/access-requests/${id}/approve`;
export const URL_BACKEND_ADMIN_REJECT_ACCESS_REQUEST = (id: number) => `/api/admin/access-requests/${id}`;
export const URL_BACKEND_ADMIN_USERS = "/api/admin/users";
export const URL_BACKEND_ADMIN_DELETE_USER = (id: number) => `/api/admin/users/${id}`;

// Focus stops for deviation filtering (StopArea.id from the deviations API).
// When non-empty, stop-specific deviations are only shown if their stop matches one of these IDs.
// Deviations with no stop scope (line-wide) are always shown.
// When empty, no stop filtering is applied and all deviations are shown.
export const DEVIATION_FOCUS_STOPS_TRAIN: number[] = [6041, 12138, 3431, 6031, 12346, 50242, 4543, 1131, 10151, 5320, 1051, 5011, 5901, 10291, 80055, 10910, 4301, 5300, 5310];
//                                                    Spånga,      Sundbyberg,                     Odenplan,          Centralen
export const DEVIATION_FOCUS_STOPS_SUBWAY: number[] = [1231, 12217, 15339, 1221, 12001, 1211, 12029, 12579, 1201, 4201, 4525, 12025, 1171, 10437, 1161, 12977, 17308, 1151, 10369, 1141, 10363, 1131, 10151, 5320, 10545, 1121, 1111, 10024, 11525, 1051, 5011, 5901, 10291, 80055, 10910, 4301, 5300, 5310, 1021, 10387, 8012];
//                                                     Brommaplan,         Abrahamsberg,Stora Mossen,       Alvik,                   Kristineb,   Thorildsplan,       Fridhemspla, St Erikspl,  Odenplan,          Rådmansgat,  Hötorget            T-Centralen                                              Gamla stan
export const DEVIATION_FOCUS_STOPS_BUS: number[] = [];

export const URL_GET_TRAVEL_FROM_TO_v2 = (origin: string, dest: string) =>
  "https://journeyplanner.integration.sl.se/v2/trips" +
  "?type_origin=any" +
  "&type_destination=any" +
  "&name_origin=" + origin +
  "&name_destination=" + dest +
  "&calc_number_of_trips=3" +
  // "&itd_time=1922" +
  // "&itd_trip_date_time_dep_arr=dep" +
  "&calc_one_direction=true"         // if false, report one trip before departure.

function createWGS84(lat: number, long: number) {
//  18.013809:59.335104:WGS84[dd.ddddd]
//  long     :lat      :WGS84[dd.ddddd]
  const fmt = (n: number) => (Object.is(n, -0) ? 0 : n).toFixed(5);
  return `${fmt(long)}:${fmt(lat)}:WGS84[dd.ddddd]`;
}

export const URL_GET_TRAVEL_COORD_TO_v2 = (long: number, lat: number, dest: string, maxWalk: number) =>
  "https://journeyplanner.integration.sl.se/v2/trips" +
  "?type_origin=coord" +
  "&type_destination=any" +
  "&name_origin=" + createWGS84(lat, long) +
  "&name_destination=" + dest +
  "&calc_number_of_trips=3" +
  "&tr_it_mot_value100=" + maxWalk +
  // "&itd_time=1922" +
  // "&itd_trip_date_time_dep_arr=dep" +
  "&calc_one_direction=true"         // if false, report one trip before departure.

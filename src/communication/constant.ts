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

export const URL_GET_TRAVEL_COORD_TO_v2 = (long: number, lat: number, dest: string) =>
  "https://journeyplanner.integration.sl.se/v2/trips" +
  "?type_origin=coord" +
  "&type_destination=any" +
  "&name_origin=" + createWGS84(lat, long) +
  "&name_destination=" + dest +
  "&calc_number_of_trips=3" +
  // "&itd_time=1922" +
  // "&itd_trip_date_time_dep_arr=dep" +
  "&calc_one_direction=true"         // if false, report one trip before departure.

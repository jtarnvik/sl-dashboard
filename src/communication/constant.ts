export const SITE_SKOGSLOPARVAGEN_4_CHAR = "3715";
export const SITE_SKOGSLOPARVAGEN_9_CHAR = "300103715"; 
export const SITE_CENTRALEN_9_CHAR = "300109001";
export const SITE_SPANGA_9_CHAR = "301109704";
export const URL_GET_DEPARTURES_FROM_SITE = (stop: string) => "https://transport.integration.sl.se/v1/sites/" + stop + "/departures";

export const URL_GET_TRAVEL_FROM_TO = (origin: string, dest: string, via?: string) =>
  "https://journeyplanner.integration.sl.se/v1/TravelplannerV3_1/trip.json?key=TRAFIKLAB-SLAPI-INTEGRATION-2024&" +
  "originExtId=" + origin +
  "&destExtId=" + dest +
  ((via)? ("&via=" + via): "")

export const URL_SEARCH_STOP = "https://journeyplanner.integration.sl.se/v1/nearbystopsv2.json?originCoordLat=59.3646686&originCoordLong=17.9251941&key=TRAFIKLAB-SLAPI-INTEGRATION-2024"
import {Journey, JourneyState} from "../types/sl-responses.ts";

/**
 * What a departure's journey state means for presentation. Derived from the SL `JourneyState` enum, which is
 * far more granular than anything the UI wants to draw — four separate "moving" states all read as one thing
 * to a passenger.
 */
export enum JourneyStyling {
  CANCELLED,
  PLANNED,
  EN_ROUTE,
  UNKNOWN,
  DONE
}

export function journeyStateToStyling(state: JourneyState): JourneyStyling {
  switch (state) {
    // @formatter:off
    case "NOTEXPECTED":      return JourneyStyling.CANCELLED;
    case "NOTRUN":           return JourneyStyling.CANCELLED;
    case "EXPECTED":         return JourneyStyling.PLANNED;
    case "ASSIGNED":         return JourneyStyling.PLANNED;
    case "CANCELLED":        return JourneyStyling.CANCELLED;
    case "SIGNEDON":         return JourneyStyling.PLANNED;
    case "ATORIGIN":         return JourneyStyling.PLANNED;
    case "FASTPROGRESS":     return JourneyStyling.EN_ROUTE;
    case "NORMALPROGRESS":   return JourneyStyling.EN_ROUTE;
    case "SLOWPROGRESS":     return JourneyStyling.EN_ROUTE;
    case "NOPROGRESS":       return JourneyStyling.EN_ROUTE;
    case "OFFROUTE":         return JourneyStyling.CANCELLED;
    case "ABORTED":          return JourneyStyling.CANCELLED;
    case "COMPLETED":        return JourneyStyling.DONE;
    case "ASSUMEDCOMPLETED": return JourneyStyling.DONE;
    // @formatter:on
  }
}

export function stylingForJourney(journey?: Journey): JourneyStyling {
  if (!journey?.state) {
    return JourneyStyling.UNKNOWN;
  }
  return journeyStateToStyling(journey.state);
}

/**
 * Whether this departure stands a chance of being found in the live traffic view.
 *
 * Live traffic is built from the GTFS-RT VehiclePositions feed, which only carries vehicles that are actually
 * out reporting positions. A departure still shown as "Planerad" is a timetable entry — the vehicle may not
 * even have started its run yet — so there is nothing on the schematic to point at, and offering the click
 * would promise something that cannot be delivered.
 *
 * `prediction_state` is the second half of the rule: SL populates it exactly when it has a live fix on the
 * vehicle (`NORMAL` on every moving row observed, absent on every planned one). `LOSTCONTACT` and
 * `UNRELIABLE` are SL saying it is still showing the journey as moving while admitting it cannot see the
 * vehicle — precisely the case where a search would come back empty. Absent is treated as fine rather than
 * suspect, so an unpopulated field never silently disables the feature.
 */
export function isTrackableJourney(journey?: Journey): boolean {
  if (stylingForJourney(journey) !== JourneyStyling.EN_ROUTE) {
    return false;
  }
  return journey?.prediction_state !== "LOSTCONTACT" && journey?.prediction_state !== "UNRELIABLE";
}

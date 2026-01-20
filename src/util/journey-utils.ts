import {Leg, PRODUCT_CLASS_FOOTPATH} from "../types/sl-journeyplaner-responses";
import {LegStopPoint} from "../components/common/model/leg-stop-point.ts";
import {LegType} from "../components/common/model/leg-type.ts";
import {LegDuration} from "../components/common/model/leg-duration.ts";

export const isFootpath = (leg: Leg): boolean => {
  return !!leg.footPathInfo || leg.transportation?.product.class === PRODUCT_CLASS_FOOTPATH;
};

export type LegsForJourney = {
  origin: LegStopPoint;
  dest: LegStopPoint;
  duration: LegDuration;
}

export const findJourneyLegs = (legs: Leg[]): LegsForJourney => {
  const first = legs[0];
  const last = legs[legs.length - 1];
  const origin = new LegStopPoint(first, LegType.ORIGIN);
  const dest = new LegStopPoint(last, LegType.DESTINATION);
  return {
    origin, dest, duration: new LegDuration(origin, dest)
  };
};
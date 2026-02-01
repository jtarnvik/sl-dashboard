import {Leg, Product, PRODUCT_CLASS_FOOTPATH, PRODUCT_CLASS_FOOTPATH_2} from "../types/sl-journeyplaner-responses";
import {LegStopPoint} from "../components/common/model/leg-stop-point.ts";
import {LegType} from "../components/common/model/leg-type.ts";
import {LegDuration} from "../components/common/model/leg-duration.ts";

export const isFootPathForLeg = (leg: Leg): boolean => {
  return !!leg.transportation?.product && isFootPathForProduct(leg.transportation?.product);
};

export function isFootPathForProduct(product:Product) {
  return product.class === PRODUCT_CLASS_FOOTPATH ||
    product.class === PRODUCT_CLASS_FOOTPATH_2;
}

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
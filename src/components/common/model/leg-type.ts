import {Leg, StopPoint} from "../../../types/sl-journeyplaner-responses.ts";
import {ceil, floor} from "./rounding.ts";

export const LegType = {
  ORIGIN: {
    stopPoint: (leg: Leg) => leg.origin,
    getBaseTimetable: (stop: StopPoint) => stop.departureTimeBaseTimetable as string,
    getEstimated: (stop: StopPoint) => stop.departureTimeEstimated as string,
    getPlanned: (stop: StopPoint) => stop.departureTimePlanned as string,
    round: floor
  },
  DESTINATION: {
    stopPoint: (leg: Leg) => leg.destination,
    getBaseTimetable: (stop: StopPoint) => stop.arrivalTimeBaseTimetable as string,
    getEstimated: (stop: StopPoint) => stop.arrivalTimeEstimated as string,
    getPlanned: (stop: StopPoint) => stop.arrivalTimePlanned as string,
    round: ceil
  },
} as const;
export type LegType = typeof LegType[keyof typeof LegType];


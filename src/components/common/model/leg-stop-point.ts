import {Leg} from "../../../types/sl-journeyplaner-responses.ts";
import {LegType} from "./leg-type.ts";
import {DateTime} from "luxon";

export class LegStopPoint {
  private _leg: Leg;

  private baseTimetable: string;
  private estimated: string;
  private planned: string;

  private baseTimetableDT: DateTime;
  private estimatedDT: DateTime;
  private plannedDT: DateTime;

  private estimatedRounded: DateTime;
  private baseTimetableRounded: DateTime;

  constructor(leg: Leg, legType: LegType) {
    this._leg = leg;

    this.baseTimetable = legType.getBaseTimetable(legType.stopPoint(leg));
    this.baseTimetableDT = DateTime.fromISO(this.baseTimetable);
    this.estimated = legType.getEstimated(legType.stopPoint(leg));
    this.estimatedDT = DateTime.fromISO(this.estimated);
    this.planned = legType.getPlanned(legType.stopPoint(leg));
    this.plannedDT = DateTime.fromISO(this.planned);

    this.estimatedRounded = legType.round(this.estimatedDT);
    this.baseTimetableRounded = legType.round(this.baseTimetableDT);
  }

  public get leg(): Leg {
    return this._leg;
  }

  public get estimatedTime(): DateTime {
    return this.estimatedRounded;
  }

  public get estimatedTimeString(): string {
    return this.estimatedRounded.toLocaleString(DateTime.TIME_24_SIMPLE);
  }

  public get timeTableTime(): DateTime {
    return this.baseTimetableRounded;
  }

  toString(): string {
    const baseTimetableTime = this.baseTimetableDT?.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
    const estimatedDTTime = this.estimatedDT?.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
    const plannedDTTime = this.plannedDT?.toLocaleString(DateTime.TIME_24_WITH_SECONDS);

    const estDTTime = this.estimatedRounded?.toLocaleString(DateTime.TIME_24_SIMPLE);
    const baseTimetableTimeRounded = this.baseTimetableRounded?.toLocaleString(DateTime.TIME_24_SIMPLE);
    return `baseTimetable: ${baseTimetableTime}/${baseTimetableTimeRounded} estimated: ${estimatedDTTime}/${estDTTime} planned: ${plannedDTTime}`;
  }
}
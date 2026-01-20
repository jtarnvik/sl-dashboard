import {LegStopPoint} from "./leg-stop-point.ts";
import {Duration} from "luxon";

export class LegDuration {
  private from: LegStopPoint;
  private to: LegStopPoint;
  private _duration: Duration;

  constructor(fromLeg: LegStopPoint, toLeg: LegStopPoint) {
    this.from = fromLeg;
    this.to = toLeg;

    this._duration = this.to.estimatedTime.diff(this.from.estimatedTime);
  }

  public get duration() {
    return this._duration;
  }

  public get durationString() {
    return this._duration.toFormat("mm");
  }

  toString(): string {
    // return this.duration.toLocaleString();
    return this.duration.toFormat("hh:mm");
  }
}
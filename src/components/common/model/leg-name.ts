import {Leg} from "../../../types/sl-journeyplaner-responses.ts";
import {LegType} from "./leg-type.ts";

export class LegName {
  private _hasTrack: boolean = false;
  private track: string = "";
  private _name: string = "";

  constructor(leg: Leg, legType: LegType) {
    let stopPoint = legType.stopPoint(leg);
    const presName = stopPoint.disassembledName;
    if (!presName) {
      return;
    }

    if (presName.length < 3 && stopPoint.parent?.disassembledName) {
      this.track = presName;
      this._hasTrack = true;
      this._name = stopPoint.parent.disassembledName;
    } else {
      this._name = presName;
    }
  }

  public get name() : string {
    return this._hasTrack ? `Track ${this.track}, ${this._name}` : this._name;
  }

  public get nonTrackedName() : string {
    return this._name;
  }

  public get hasTrack() : boolean {
    return this._hasTrack;
  }

  public get onlyTrackedName() : string {
    if (!this._hasTrack) {
      return "";
    }
    return this.track;
  }
}
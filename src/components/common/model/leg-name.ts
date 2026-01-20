import {Leg} from "../../../types/sl-journeyplaner-responses.ts";
import {LegType} from "./leg-type.ts";

export class LegName {
  private hasTrack: boolean = false;
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
      this.hasTrack = true;
      this._name = stopPoint.parent.disassembledName;
    } else {
      this._name = presName;
    }
  }

  public get name() : string {
    return this.hasTrack ? `Track ${this.track}, ${this._name}` : this._name;
  }
}
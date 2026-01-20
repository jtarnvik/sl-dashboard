import {Leg} from "../../types/sl-journeyplaner-responses";
import {SldLegTitle} from "./sld-leg-title.tsx";
import {LegStopPoint} from "../common/model/leg-stop-point.ts";
import {LegType} from "../common/model/leg-type.ts";
import {findJourneyLegs} from "../../util/journey-utils.ts";

type Props = {
  leg: Leg
}

export function SldLeg({leg}: Props) {
  const headerLegs = findJourneyLegs([leg, leg]);

  const timeOrigin = new LegStopPoint(leg, LegType.ORIGIN);
  const timeDestination = new LegStopPoint(leg, LegType.DESTINATION);

  return (
    <div>
      --
      <br/>
       leg
      <SldLegTitle headerLegs={headerLegs} />
      origin: {timeOrigin.toString()}
      <br/>
      destination: {timeDestination.toString()}
      <br/>
      --
      <br/>
    </div>
  );
}
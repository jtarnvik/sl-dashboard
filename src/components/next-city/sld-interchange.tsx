import {Leg} from "../../types/sl-journeyplaner-responses";
import {LegStopPoint} from "../common/model/leg-stop-point.ts";
import {LegType} from "../common/model/leg-type.ts";
import {LegDuration} from "../common/model/leg-duration.ts";

type Props = {
  leg: Leg
}

export function SldInterchange({leg}:Props) {
  const timeOrigin = new LegStopPoint(leg, LegType.ORIGIN);
  const timeDestination = new LegStopPoint(leg, LegType.DESTINATION);

  const duration = new LegDuration(timeOrigin, timeDestination);

  // anv duration
  return (
    <div>
      Interchange {duration.toString()}
      <br/>
      origin: {timeOrigin.toString()}
      <br/>
      destination: {timeDestination.toString()}
      <br/>
    </div>
  );
}
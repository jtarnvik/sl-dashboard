import {Leg} from "../../types/sl-journeyplaner-responses";
import {LegStopPoint} from "../common/model/leg-stop-point.ts";
import {LegType} from "../common/model/leg-type.ts";
import {LegDuration} from "../common/model/leg-duration.ts";

type Props = {
  leg: Leg,
}

export function SldWalk({leg}: Props) {
  const destLeg = leg.extraInterchange || leg;
  const timeOrigin = new LegStopPoint(leg, LegType.ORIGIN);
  const timeDestination = new LegStopPoint(destLeg, LegType.DESTINATION);
  const duration = new LegDuration(timeOrigin, timeDestination);

  return (
    <div>
      <div className="flex justify-between">
        <div>
          {timeOrigin.estimatedTimeString} Gå till
        </div>
        <div>
          {duration.durationString} min
        </div>
      </div>
    </div>
  );
}
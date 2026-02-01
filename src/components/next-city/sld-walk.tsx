import {Leg} from "../../types/sl-journeyplaner-responses";
import {LegStopPoint} from "../common/model/leg-stop-point.ts";
import {LegType} from "../common/model/leg-type.ts";
import {LegDuration} from "../common/model/leg-duration.ts";
import {LegName} from "../common/model/leg-name.ts";

type Props = {
  leg: Leg,
}

export function SldWalk({leg}: Props) {
  const destLeg = leg.extraInterchange || leg;

  const timeOrigin = new LegStopPoint(leg, LegType.ORIGIN);
  const timeDestination = new LegStopPoint(destLeg, LegType.DESTINATION);

  const duration = new LegDuration(timeOrigin, timeDestination);
  const destName = new LegName(destLeg, LegType.DESTINATION);

  return (
    <div>
      <div className="flex justify-between">
        <div>
          Promenad{(!destName.hasTrack) ? destName.name : ", gå till spår " + destName.onlyTrackedName}
        </div>
        <div>
          {duration.durationString} min
        </div>
      </div>
    </div>
  );
}
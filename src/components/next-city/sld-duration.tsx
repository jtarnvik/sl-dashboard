import {LegsForJourney} from "../../util/journey-utils.ts";
import {BreadCrumbArrow} from "../common/base/bread-crumb-arrow.tsx";

type Props = {
  headerLegs: LegsForJourney,
  highlightDiff?: boolean
}

export function SldDuration({headerLegs, highlightDiff = false}: Props) {
  return (
    <div className="flex justify-between">
      <div className="flex gap-1">
        {headerLegs.origin.estimatedTimeString}
        <BreadCrumbArrow />
        {headerLegs.dest.estimatedTimeString}
        {highlightDiff && headerLegs.dest.hasDestScheduluDifference &&
          <span className="line-through text-gray-500">{headerLegs.dest.timeTableTimeString}</span>
        }
      </div>
      <div>{headerLegs.duration.durationString} min</div>
    </div>
  );
}
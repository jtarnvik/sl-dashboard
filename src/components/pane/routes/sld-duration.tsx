import {LegsForJourney} from "../../../util/journey-utils.ts";

type Props = {
  headerLegs: LegsForJourney,
}

export function SldDuration({headerLegs}: Props) {
  return (
    <div>{headerLegs.duration.durationString} min</div>
  );
}
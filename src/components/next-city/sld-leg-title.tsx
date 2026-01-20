import {LegsForJourney} from "../../util/journey-utils.ts";
import {LegName} from "../common/model/leg-name.ts";
import {LegType} from "../common/model/leg-type.ts";

type Props = {
  headerLegs: LegsForJourney
}

export function SldLegTitle({headerLegs}: Props) {
  const originName = new LegName(headerLegs.origin.leg, LegType.ORIGIN);
  const destName = new LegName(headerLegs.dest.leg, LegType.DESTINATION);

  return (
    <div>
      {originName.name} - {destName.name}
    </div>
  );
}
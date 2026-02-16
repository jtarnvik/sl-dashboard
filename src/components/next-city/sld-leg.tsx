import {Leg} from "../../types/sl-journeyplaner-responses";
import {SldLegTitle} from "./sld-leg-title.tsx";
import {findJourneyLegs} from "../../util/journey-utils.ts";
import {SldDuration} from "./sld-duration.tsx";
import {LineTransportation} from "../common/line";
import {capitalizeFirst} from "../../util/util.ts";
import {SldSchedule} from "./sld-schedule.tsx";
import {DeviationWrapper} from "../common/deviation-wrapper";

type Props = {
  leg: Leg
}

export function SldLeg({leg}: Props) {
  const headerLegs = findJourneyLegs([leg, leg]);

  return (
    <div>
      <div className="flex justify-between">
        <SldSchedule headerLegs={headerLegs} highlightDiff={true} />
        <DeviationWrapper leg={leg}>
          <SldDuration headerLegs={headerLegs} />
        </DeviationWrapper >
      </div>
      <SldLegTitle headerLegs={headerLegs} />
      {leg.transportation &&
        <div className="flex gap-2">
          <LineTransportation transpo={leg.transportation} />
          <div>
            {capitalizeFirst(leg.transportation?.number)} mot {capitalizeFirst(leg.transportation?.destination?.name)}
          </div>
        </div>
      }
    </div>
);
}
import {Leg} from "../../types/sl-journeyplaner-responses";
import {SldLegTitle} from "./sld-leg-title.tsx";
import {findJourneyLegs} from "../../util/journey-utils.ts";
import {SldDuration} from "./sld-duration.tsx";
import {LineTransportation} from "../common/line";
import {capitalizeFirst} from "../../util/util.ts";

type Props = {
  leg: Leg
}

export function SldLeg({leg}: Props) {
  console.log(leg);
  const headerLegs = findJourneyLegs([leg, leg]);

  return (
    <div>
      <SldDuration headerLegs={headerLegs} highlightDiff={true} />
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
  )
    ;
}
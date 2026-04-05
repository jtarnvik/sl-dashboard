import {Leg} from "../../../types/sl-journeyplaner-responses";
import {SldLegTitle} from "./sld-leg-title.tsx";
import {findJourneyLegs} from "../../../util/journey-utils.ts";
import {SldDuration} from "./sld-duration.tsx";
import {LineTransportation} from "../../common/line";
import {capitalizeFirst} from "../../../util/util.ts";
import {SldSchedule} from "./sld-schedule.tsx";
import {DeviationWrapper} from "../../common/deviation-wrapper";
import {convertInfoMessages} from "../../common/deviation-modal";
import {BackendInterpretationResult, EnrichedDeviation, isShown} from "../../../types/deviations-common.ts";

type Props = {
  leg: Leg;
  deviationEnrichment: Map<string, BackendInterpretationResult>;
}

export function SldLeg({leg, deviationEnrichment}: Props) {
  const headerLegs = findJourneyLegs([leg, leg]);

  const legDeviations: EnrichedDeviation[] = convertInfoMessages(leg.infos ?? [])
    .map(common => {
      const result = deviationEnrichment.get(common.message);
      if (!result) { return null; }
      return { ...common, ...result } as EnrichedDeviation;
    })
    .filter((d): d is EnrichedDeviation => d !== null)
    .filter(isShown);

  return (
    <div>
      <div className="flex justify-between">
        <SldSchedule headerLegs={headerLegs} highlightDiff={true} />
        <DeviationWrapper deviations={legDeviations}>
          <SldDuration headerLegs={headerLegs} />
        </DeviationWrapper>
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
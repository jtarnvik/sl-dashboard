import React, {JSX} from "react";
import {SldInterchange} from "./sld-interchange.tsx";
import {SldLeg} from "./sld-leg.tsx";
import {SldWalk} from "./sld-walk.tsx";
import {isFootPathForLeg} from "../../../util/journey-utils.ts";
import {BackendInterpretationResult} from "../../../types/deviations-common.ts";
import {Leg} from "../../../types/sl-journeyplaner-responses.ts";

type GeneralLegComponentProps = {
  leg: Leg;
  index: number;
  deviationEnrichment: Map<string, BackendInterpretationResult>;
}

function GeneralLegComponent({leg, index, deviationEnrichment}: GeneralLegComponentProps): JSX.Element {
  if (isFootPathForLeg(leg)) {
    if (index === 0) {
      return (<SldWalk leg={leg} />);
    } else {
      return (<SldInterchange leg={leg} />);
    }
  } else {
    return (<SldLeg leg={leg} deviationEnrichment={deviationEnrichment} />);
  }
}

type Props = {
  legs: Leg[];
  deviationEnrichment: Map<string, BackendInterpretationResult>;
}

export function SldJourneyDetails({legs, deviationEnrichment}: Props) {
  return (
    <div className="bg-[#F8F9FA] border border-gray-200 shadow-xs rounded-md rounded-t-none p-[10px] ms-[10px] me-[10px] mb-2">
      {legs.map((leg, index) => {
        return (
          <React.Fragment key={index}>
            <GeneralLegComponent leg={leg} index={index} deviationEnrichment={deviationEnrichment} />
            {index < legs.length - 1 && (
              <hr className="border-0 border-t-2 border-gray-300 mx-1 my-2" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
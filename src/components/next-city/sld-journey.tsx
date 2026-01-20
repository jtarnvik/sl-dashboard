import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {SldWalk} from "./sld-walk.tsx";
import {SldInterchange} from "./sld-interchange.tsx";
import {SldLeg} from "./sld-leg.tsx";
import {JSX} from "react";
import {Journey, Leg, PRODUCT_CLASS_FOOTPATH} from "../../types/sl-journeyplaner-responses.ts";
import {SldJourneyTitle} from "./sld-journey-title.tsx";
import {findJourneyLegs} from "../../util/journey-utils.ts";
import {ImArrowRight2} from "react-icons/im";
import {SldBreadCrumbs} from "./sld-bread-crumbs.tsx";

type GLCProps = {
  leg: Leg,
  index: number
}

function GeneralLegComponent({leg, index}: GLCProps): JSX.Element {
  if (leg.transportation?.product.class === PRODUCT_CLASS_FOOTPATH) {
    if (index === 0) {
      return (<SldWalk leg={leg} />);
    } else {
      return (<SldInterchange leg={leg} />);
    }
  } else {
    return (<SldLeg leg={leg} />);
  }
}

type Props = {
  journey: Journey
}

export function SldJourney({journey}: Props) {
  const headerLegs = findJourneyLegs(journey.legs);

  return (
    <div className="bg-[#F8F9FA] border border-gray-200 shadow-sm rounded-md p-[10px] mb-2">
      <div className="flex justify-between">
        <div className="flex gap-1">
          {headerLegs.origin.estimatedTimeString}
          <ImArrowRight2 className="ms-1 mt-[4px]" />
          {headerLegs.dest.estimatedTimeString}
        </div>
        <div>{headerLegs.duration.durationString} min</div>
      </div>
      <div>
        <SldJourneyTitle headerLegs={headerLegs} />
      </div>
      <div>
        <SldBreadCrumbs legs={journey.legs} />
      </div>
      <div hidden={true}>
        duration: {shortSwedishHumanizer(journey.tripDuration * 1000)} -
        durationRt: {shortSwedishHumanizer(journey.tripRtDuration * 1000)} -
        additional {(journey.isAdditional) ? "add-T" : "add-F"} -
        interchanges {journey.interchanges}
        {journey.legs.map((leg, index) => {
          return (<GeneralLegComponent leg={leg} index={index} key={index} />);
        })}
      </div>
    </div>
  );
}
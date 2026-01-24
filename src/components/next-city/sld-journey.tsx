import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {Journey} from "../../types/sl-journeyplaner-responses.ts";
import {SldJourneyTitle} from "./sld-journey-title.tsx";
import {findJourneyLegs} from "../../util/journey-utils.ts";
import {ImArrowRight2} from "react-icons/im";
import {SldBreadCrumbs} from "./sld-bread-crumbs.tsx";
import {SldLegDetails} from "./sld-leg-details.tsx";
import {useState} from "react";
import classNames from "classnames";

type Props = {
  journey: Journey
}

export function SldJourney({journey}: Props) {
  const [showLegs, setShowLegs] = useState<boolean>(false);

  const headerLegs = findJourneyLegs(journey.legs);

  const journeyClasses = classNames({
    'bg-[#F8F9FA] border border-gray-200 shadow-sm rounded-md p-[10px]': true,
    'cursor-pointer': true,
    'mb-2': !showLegs
  });
  
  return (
    <div>
      <div 
        className={journeyClasses}
        onClick={() => setShowLegs(!showLegs)}
      >
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
        </div>
      </div>
      {showLegs &&
        <SldLegDetails legs={journey.legs} />
      }
    </div>
  );
}
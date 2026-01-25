import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {Journey} from "../../types/sl-journeyplaner-responses.ts";
import {SldJourneyTitle} from "./sld-journey-title.tsx";
import {findJourneyLegs} from "../../util/journey-utils.ts";
import {SldBreadCrumbs} from "./sld-bread-crumbs.tsx";
import {SldLegDetails} from "./sld-leg-details.tsx";
import {useState} from "react";
import classNames from "classnames";
import {BreadCrumbArrow} from "../common/base/bread-crumb-arrow.tsx";

type Props = {
  journey: Journey
}

export function SldJourney({journey}: Props) {
  const [showLegs, setShowLegs] = useState<boolean>(false);

  const headerLegs = findJourneyLegs(journey.legs);

  const journeyClasses = classNames({
    'bg-[#F8F9FA] border border-gray-200 shadow p-[10px]': true,
    'cursor-pointer': true,
    'mb-2': !showLegs,
    'rounded-md': !showLegs,
    'rounded-md rounded-b-none': showLegs,
    'relative z-20': true
  });

  return (
    <div className="relative">
      <div
        className={journeyClasses}
        onClick={() => setShowLegs(!showLegs)}
      >
        <div className="flex justify-between">
          <div className="flex gap-1">
            {headerLegs.origin.estimatedTimeString}
            <BreadCrumbArrow />
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

      {showLegs && (
        <div className="relative z-10 -mt-2">
          <SldLegDetails legs={journey.legs} />
        </div>
      )}
    </div>
  );
}
import {shortSwedishHumanizer} from "../../util/humanizer.ts";
import {Journey, Leg} from "../../types/sl-journeyplaner-responses.ts";
import {SldJourneyTitle} from "./sld-journey-title.tsx";
import {findJourneyLegs, isFootPathForLeg} from "../../util/journey-utils.ts";
import {SldBreadCrumbs} from "./sld-bread-crumbs.tsx";
import {SldJourneyDetails} from "./sld-journey-details.tsx";
import {useState} from "react";
import classNames from "classnames";
import {SldDuration} from "./sld-duration.tsx";
import {ModalDialog} from "../common/modal-dialog";
import {SLButton} from "../common/sl-button";

type Props = {
  journey: Journey
}

export function SldJourney({journey}: Props) {
  const [showLegs, setShowLegs] = useState<boolean>(false);
  const [jsonOpen, setJsonOpen] = useState<boolean>(false);

  function adjustInitialWalks(legs: Leg[]) {
    const result = legs.slice();
    if (result.length > 2 && isFootPathForLeg(result[0]) && isFootPathForLeg(result[1])) {
      const removedLegs = result.splice(1, 1);
      if (removedLegs.length !== 1) {
        throw new Error("Unexpected number of removed legs, removed " + removedLegs.length + " legs, expected 1");
      }
      result[0].extraInterchange = removedLegs[0];
    }
    return result;
  }

  const adjustedLegs = adjustInitialWalks(journey.legs);

  const headerLegs = findJourneyLegs(adjustedLegs);
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
      <ModalDialog
        isOpen={jsonOpen}
        onClose={() => setJsonOpen(false)}
        title={"Response Data"}
        scrollable={true}
      >
        <pre>
          {JSON.stringify(headerLegs.origin.leg.origin,null, 2)}
        </pre>
      </ModalDialog>

      <div
        className={journeyClasses}
        onClick={() => setShowLegs(!showLegs)}
      >
        <SldDuration headerLegs={headerLegs} />
        <SldJourneyTitle headerLegs={headerLegs} />
        <div className="flex justify-between gap-2">
          <SldBreadCrumbs legs={adjustedLegs} />
          <SLButton onClick={() => setJsonOpen(true)} thin>JSON</SLButton>
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
          <SldJourneyDetails legs={adjustedLegs} />
        </div>
      )}
    </div>
  );
}
import {useContext, useState} from "react";
import classNames from "classnames";
import {IoWarningOutline} from "react-icons/io5";
import { RiUserSharedLine } from "react-icons/ri";
import {useNavigate} from "react-router-dom";
import {convertInfoMessages} from "../../common/deviation-modal";
import {ModalDialog} from "../../common/modal-dialog";
import {SLButton} from "../../common/sl-button";
import {SldBreadCrumbs} from "./sld-bread-crumbs.tsx";
import {SldDuration} from "./sld-duration.tsx";
import {SldJourneyDetails} from "./sld-journey-details.tsx";
import {SldJourneyTitle} from "./sld-journey-title.tsx";
import {SldSchedule} from "./sld-schedule.tsx";
import ErrorContext from "../../../contexts/error-context.ts";
import InDebugModeContext from "../../../contexts/debug-context.ts";
import {findJourneyLegs, isFootPathForLeg} from "../../../util/journey-utils.ts";
import {shortSwedishHumanizer} from "../../../util/humanizer.ts";
import {BackendInterpretationResult, EnrichedDeviation, isShown} from "../../../types/deviations-common.ts";
import {Journey, Leg} from "../../../types/sl-journeyplaner-responses.ts";
import {createSharedRoute} from "../../../communication/backend.ts";
import {useUserLoginState, UserLoginState} from "../../../hook/use-user.ts";

type Props = {
  journey: Journey;
  deviationEnrichment: Map<string, BackendInterpretationResult>;
  alwaysExpanded?: boolean;
}

export function SldJourney({journey, deviationEnrichment, alwaysExpanded = false}: Props) {
  const [showLegs, setShowLegs] = useState<boolean>(false);
  const expanded = alwaysExpanded || showLegs;
  const [jsonOpen, setJsonOpen] = useState<boolean>(false);
  const {inDebugMode} = useContext(InDebugModeContext);
  const {setError} = useContext(ErrorContext);
  const loginState = useUserLoginState();
  const navigate = useNavigate();

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const id = await createSharedRoute(JSON.stringify(journey), setError);
    if (id) {
      navigate(`/route/${id}`);
    }
  }

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

  function journeyDeviation(): boolean {
    return journey.legs.some(leg =>
      convertInfoMessages(leg.infos ?? []).some(common => {
        const result = deviationEnrichment.get(common.message);
        return result !== undefined && isShown({ ...common, ...result } as EnrichedDeviation);
      })
    );
  }

  const adjustedLegs = adjustInitialWalks(journey.legs);

  const headerLegs = findJourneyLegs(adjustedLegs);
  const journeyClasses = classNames({
    'bg-[#F8F9FA] border border-gray-200 shadow-sm p-[10px]': true,
    'cursor-pointer': !alwaysExpanded,
    'mb-2': !expanded,
    'rounded-md': !expanded,
    'rounded-md rounded-b-none': expanded,
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
          {JSON.stringify(headerLegs.origin.leg.origin, null, 2)}
        </pre>
      </ModalDialog>

      <div
        className={journeyClasses}
        onClick={alwaysExpanded ? undefined : () => setShowLegs(!showLegs)}
      >
        <div className="flex justify-between">
          <SldSchedule headerLegs={headerLegs} />
          <SldDuration headerLegs={headerLegs} />
        </div>
        <div className="flex justify-between">
          <div>
            <SldJourneyTitle headerLegs={headerLegs} />
            <div className="flex justify-between gap-2">
              <SldBreadCrumbs legs={adjustedLegs} />
              {inDebugMode &&
                <SLButton onClick={() => setJsonOpen(true)} thin>JSON</SLButton>
              }
            </div>
          </div>
          <div className="flex items-center gap-2">
            {journeyDeviation() &&
              <div className="deviation-color">
                <IoWarningOutline size={24} />
              </div>
            }
            {loginState === UserLoginState.LoggedIn && !alwaysExpanded &&
              <button
                onClick={handleShare}
                className="text-[#184fc2] hover:text-[#578ff3] cursor-pointer"
                title="Dela resväg"
              >
                <RiUserSharedLine size={22} />
              </button>
            }
          </div>
        </div>
        <div hidden={true}>
          duration: {shortSwedishHumanizer(journey.tripDuration * 1000)} -
          durationRt: {shortSwedishHumanizer(journey.tripRtDuration * 1000)} -
          additional {(journey.isAdditional) ? "add-T" : "add-F"} -
          interchanges {journey.interchanges}
        </div>
      </div>

      {expanded && (
        <div className="relative z-10 -mt-2">
          <SldJourneyDetails legs={adjustedLegs} deviationEnrichment={deviationEnrichment} />
        </div>
      )}
    </div>
  );
}
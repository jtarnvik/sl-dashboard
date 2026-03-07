import {ReactNode, useState} from "react";
import {convertDeviations, convertInfoMessages, DeviationInfo, DeviationModal} from "../deviation-modal";
import {Leg} from "../../../types/sl-journeyplaner-responses.ts";
import {Departure} from "../../../types/sl-responses.ts";

type Props = {
  children: ReactNode,
  departure?: Departure,
  leg?: Leg,
};

export function DeviationWrapper({children, departure, leg}: Props) {
  const [selectedDeviations, setSelectedDeviations] = useState<DeviationInfo[] | null>(null);

  let deviationInfos: DeviationInfo[] | undefined = [];
  if (departure && departure.deviations && departure.deviations.length > 0) {
    deviationInfos = convertDeviations(departure.deviations);
  } else if (leg && leg.infos && leg.infos.length > 0) {
    deviationInfos = convertInfoMessages(leg.infos);
  }

  if (!deviationInfos || deviationInfos.length === 0) {
    return (<div>{children}</div>);
  }

  return (
    <div>
      <div className={"deviation-info"} onClick={() => setSelectedDeviations(deviationInfos)}>
        {children}
      </div>
      <DeviationModal
        onClose={() => setSelectedDeviations(null)}
        open={selectedDeviations !== null}
        deviation={deviationInfos}
      />
    </div>
  );
}
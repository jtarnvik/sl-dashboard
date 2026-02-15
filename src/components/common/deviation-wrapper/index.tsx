import {ReactNode, useState} from "react";
import {convertDeviations, DeviationInfo, DeviationModal} from "../deviation-modal";

type Props = {
  children: ReactNode,
  departure?: Departure
};

export function DeviationWrapper({children, departure}: Props) {
  const [selectedDeviations, setSelectedDeviations] = useState<DeviationInfo[] | null>(null);

  let deviationInfos: DeviationInfo[] | undefined = [];
  if (departure && departure.deviations && departure.deviations.length > 0) {
    deviationInfos = convertDeviations(departure.deviations);
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
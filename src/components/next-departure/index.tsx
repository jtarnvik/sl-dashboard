import {useImperativeHandle} from "react";

export interface TrainScheduleHandle {
  manualUpdate: () => void;
}

type Props = {
  performManualUpdate?: React.Ref<TrainScheduleHandle>;
}

export function NextDeparture({performManualUpdate}: Props) {
  function manualUpdate() {
    console.log("Performing manual update")
  }

  useImperativeHandle(performManualUpdate, () => ({
    manualUpdate: manualUpdate,
  }));

  return (
    <div>Next Departure</div>
  )
}
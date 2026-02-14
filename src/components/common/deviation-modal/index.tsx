import {ModalDialog} from "../modal-dialog";

export enum DeviationType {
  INFORMATION = 1,
  CANCELLED,
  UNKNOWN,
};

export interface DeviationInfo {
  message: string,
  type: DeviationType
}

export function convertDeviations(deviations: Deviation[]): DeviationInfo[] {
  function getDeviationType(consequence?: string): DeviationType {
    if (!consequence) {
      return DeviationType.UNKNOWN;
    }
    switch (consequence) {
      case "INFORMATION": return DeviationType.INFORMATION;
      case "CANCELLED": return DeviationType.CANCELLED;
      default: return DeviationType.UNKNOWN;
    }
  }
  if (!deviations){
    return [];
  }

  const result : DeviationInfo[] = [];
  deviations.forEach(deviation => {
    const type  = getDeviationType(deviation.consequence);
    result.push({message: deviation.message, type});
  });
  return result;
}

type Props = {
  onClose: () => void,
  open: boolean,
  deviation: DeviationInfo[]
};

export function DeviationModal({onClose, open, deviation}: Props) {
  if (!open) {
    return null;
  }

  return (
    <ModalDialog
      isOpen={open}
      onClose={onClose}
      title={"Avvikelse"}
      scrollable={true}
    >
      {deviation.map((deviationInfo, index) => (
        <div key={index}>
          {deviationInfo.type} - {deviationInfo.message}
        </div>
      ))}
    </ModalDialog>
  );
}
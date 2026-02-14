import {ModalDialog} from "../modal-dialog";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { MdOutlineCancel } from "react-icons/md";

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

  const getIcon = (type: DeviationType) => {
    switch (type) {
      case DeviationType.INFORMATION:
        return <IoMdInformationCircleOutline size={24} />;
      case DeviationType.CANCELLED:
        return <MdOutlineCancel size={24} />;
      default:
        return <IoMdInformationCircleOutline size={24} />;
    }
  };

  const sortedDeviations = [...deviation].sort((a, b) => {
    if (a.type === DeviationType.CANCELLED && b.type !== DeviationType.CANCELLED) {
      return -1;
    }
    if (a.type !== DeviationType.CANCELLED && b.type === DeviationType.CANCELLED) {
      return 1;
    }
    return 0;
  });

  return (
    <ModalDialog
      isOpen={open}
      onClose={onClose}
      title={"Avvikelse"}
      scrollable={true}
    >
      <table className="border-separate border-spacing-y-2">
        <tbody>
          {sortedDeviations.map((deviationInfo, index) => (
            <tr key={index}>
              <td className="align-top">{getIcon(deviationInfo.type)}</td>
              <td className="align-top">{deviationInfo.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ModalDialog>
  );
}
import {useState} from "react";
import {IoMdInformationCircleOutline} from "react-icons/io";
import {IoChevronDown, IoChevronUp} from "react-icons/io5";
import {MdOutlineCancel} from "react-icons/md";
import {ModalDialog} from "../modal-dialog";
import { Deviation as DeviationSearch } from "../../../types/deviations";
import {InfoMessage} from "../../../types/sl-journeyplaner-responses";
import {Deviation} from "../../../types/sl-responses";

export enum DeviationType {
  INFORMATION = 1,
  CANCELLED,
  UNKNOWN,
}


export function filterDeviationsByStops(deviations: DeviationSearch[], focusStops: number[]): DeviationSearch[] {
  if (focusStops.length === 0) {
    return deviations;
  }
  return deviations.filter(deviation => {
    const stopAreas = deviation.scope?.stop_areas;
    if (!stopAreas || stopAreas.length === 0) {
      return true;
    }
    return stopAreas.some(stop => focusStops.includes(stop.id));
  });
}

export interface DeviationInfo {
  heading?: string,
  shortMessage?: string,
  message: string,
  type: DeviationType
}

export function convertInfoMessages(infos: InfoMessage[]): DeviationInfo[] {
  if (!infos) {
    return [];
  }

  const result: DeviationInfo[] = [];
  infos.forEach(info => {
    if (info?.text) {
      result.push({message: info.text, type: DeviationType.INFORMATION});
    }
    if (info.infoLinks && info.infoLinks.length > 0) {
      info.infoLinks.forEach(link => {
        result.push({message: link.title, type: DeviationType.INFORMATION});
      })
    }
  });
  return result;
}

function buildDeviationHeading(deviation: DeviationSearch, variant: { scope_alias: string }, focusStops: number[]): string | undefined {
  const stopAreas = deviation.scope?.stop_areas;
  if (stopAreas && stopAreas.length > 0) {
    const relevantStops = focusStops.length > 0
      ? stopAreas.filter(s => focusStops.includes(s.id))
      : stopAreas;
    if (relevantStops.length > 0) {
      return relevantStops.map(s => s.name).join(', ');
    }
  }
  const lines = deviation.scope?.lines;
  if (lines && lines.length > 0) {
    return variant.scope_alias;
  }
  return undefined;
}

export function convertDeviationSearch(deviations: DeviationSearch[], focusStops: number[] = []): DeviationInfo[] {
  if (!deviations) {
    return [];
  }

  const result: DeviationInfo[] = [];
  deviations.forEach(deviation => {
    const variant = deviation.message_variants.find(v => v.language === 'sv') ?? deviation.message_variants[0];
    if (!variant) {
      return;
    }
    const message = variant.details || variant.header;
    if (!message) {
      return;
    }
    const heading = buildDeviationHeading(deviation, variant, focusStops);
    const shortMessage = variant.header || undefined;
    result.push({ heading, shortMessage, message, type: DeviationType.INFORMATION });
  });
  return result;
}

export function convertDeviations(deviations: Deviation[]): DeviationInfo[] {
  function getDeviationType(consequence?: string): DeviationType {
    if (!consequence) {
      return DeviationType.UNKNOWN;
    }
    switch (consequence) {
      case "INFORMATION":
        return DeviationType.INFORMATION;
      case "CANCELLED":
        return DeviationType.CANCELLED;
      default:
        return DeviationType.UNKNOWN;
    }
  }

  if (!deviations) {
    return [];
  }

  const result: DeviationInfo[] = [];
  deviations.forEach(deviation => {
    const type = getDeviationType(deviation.consequence);
    result.push({message: deviation.message, type});
  });
  return result;
}

function getDeviationIcon(type: DeviationType) {
  switch (type) {
    case DeviationType.INFORMATION:
      return <IoMdInformationCircleOutline size={24} />;
    case DeviationType.CANCELLED:
      return <MdOutlineCancel size={24} />;
    default:
      return <IoMdInformationCircleOutline size={24} />;
  }
}

type DeviationRowProps = {
  deviationInfo: DeviationInfo
};

function DeviationRow({deviationInfo}: DeviationRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = Boolean(deviationInfo.shortMessage && deviationInfo.message);

  return (
    <tr>
      <td className="align-top">{getDeviationIcon(deviationInfo.type)}</td>
      <td className="align-top">
        {deviationInfo.heading && <div className="font-semibold">{deviationInfo.heading}</div>}
        {hasExpandable ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <span>{deviationInfo.shortMessage}</span>
              <button onClick={() => setExpanded(!expanded)} className="shrink-0 mt-[2px]">
                {expanded ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
              </button>
            </div>
            {expanded && <div className="mt-1 text-sm text-gray-700">{deviationInfo.message}</div>}
          </>
        ) : (
          deviationInfo.message
        )}
      </td>
    </tr>
  );
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
          <DeviationRow key={index} deviationInfo={deviationInfo} />
        ))}
        </tbody>
      </table>
    </ModalDialog>
  );
}
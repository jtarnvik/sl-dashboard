import { useContext, useEffect, useState } from 'react';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { MdOutlineAccessTime, MdOutlineCancel } from 'react-icons/md';
import { ModalDialog } from '../modal-dialog';
import { hideDeviation } from '../../../communication/backend.ts';
import { Deviation as DeviationSearch } from '../../../types/deviations';
import { InfoMessage } from '../../../types/sl-journeyplaner-responses';
import { Deviation } from '../../../types/sl-responses';
import { CommonDeviation, EnrichedDeviation } from '../../../types/deviations-common';
import { useUserLoginState, UserLoginState } from '../../../hook/use-user.ts';
import ErrorContext from '../../../contexts/error-context.ts';

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

export function convertInfoMessages(infos: InfoMessage[]): CommonDeviation[] {
  if (!infos) {
    return [];
  }

  const result: CommonDeviation[] = [];
  infos.forEach(info => {
    if (info?.text) {
      result.push({ message: info.text });
    }
    if (info.infoLinks && info.infoLinks.length > 0) {
      info.infoLinks.forEach(link => {
        result.push({ message: link.title });
      });
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

export function convertDeviationSearch(deviations: DeviationSearch[], focusStops: number[] = []): CommonDeviation[] {
  if (!deviations) {
    return [];
  }

  const result: CommonDeviation[] = [];
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
    result.push({ heading, shortMessage, message });
  });
  return result;
}

export function convertDeviations(deviations: Deviation[]): CommonDeviation[] {
  if (!deviations) {
    return [];
  }

  return deviations.map(deviation => ({ message: deviation.message }));
}

function getImportanceColor(importance: EnrichedDeviation['importance']): string {
  switch (importance) {
    case 'HIGH':   return '#DC2626';
    case 'MEDIUM': return '#D97706';
    default:       return '#6B7280';
  }
}

function getDeviationIcon(deviation: EnrichedDeviation) {
  const color = getImportanceColor(deviation.importance);
  if (deviation.cancelations) {
    return <MdOutlineCancel size={24} color={color} />;
  }
  if (deviation.delays) {
    return <MdOutlineAccessTime size={24} color={color} />;
  }
  return <IoMdInformationCircleOutline size={24} color={color} />;
}

type DeviationRowProps = {
  enriched: EnrichedDeviation;
  onHide?: (id: number) => void;
};

function DeviationRow({ enriched, onHide }: DeviationRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = Boolean(enriched.shortMessage && enriched.message);
  const canHide = onHide !== undefined && enriched.id !== null;

  return (
    <tr>
      <td className="align-top">{getDeviationIcon(enriched)}</td>
      <td className="align-top">
        {enriched.heading && <div className="font-semibold">{enriched.heading}</div>}
        {hasExpandable ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <span>{enriched.shortMessage}</span>
              <button onClick={() => setExpanded(!expanded)} className="shrink-0 mt-[2px]">
                {expanded ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
              </button>
            </div>
            {expanded && <div className="mt-1 text-sm text-gray-700">{enriched.message}</div>}
          </>
        ) : (
          enriched.message
        )}
        {canHide && (
          <div className="mt-1">
            <button
              onClick={() => onHide(enriched.id!)}
              className="text-s text-[#184fc2] hover:text-[#578ff3]"
            >
              Dölj
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

type Props = {
  onClose: () => void;
  open: boolean;
  deviations: EnrichedDeviation[];
};

export function DeviationModal({ onClose, open, deviations }: Props) {
  const { setError } = useContext(ErrorContext);
  const loginState = useUserLoginState();
  const [visible, setVisible] = useState<EnrichedDeviation[]>(deviations);

  useEffect(() => {
    if (open) {
      setVisible(deviations);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleHide(id: number) {
    const success = await hideDeviation(id, setError);
    if (success) {
      const remaining = visible.filter(d => d.id !== id);
      if (remaining.length === 0) {
        onClose();
      } else {
        setVisible(remaining);
      }
    }
  }

  const importanceRank = (d: EnrichedDeviation) => ({ HIGH: 0, MEDIUM: 1, LOW: 2, UNKNOWN: 3 })[d.importance] ?? 3;

  const sortedDeviations = [...visible].sort((a, b) => {
    if (a.cancelations && !b.cancelations) { return -1; }
    if (!a.cancelations && b.cancelations) { return 1; }
    return importanceRank(a) - importanceRank(b);
  });

  const onHide = loginState === UserLoginState.LoggedIn ? handleHide : undefined;

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
          <DeviationRow key={index} enriched={deviationInfo} onHide={onHide} />
        ))}
        </tbody>
      </table>
    </ModalDialog>
  );
}

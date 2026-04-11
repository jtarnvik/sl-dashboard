import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';

import { convertInfoMessages } from '../../common/deviation-modal';
import { LineTransportation } from '../../common/line';
import { BreadCrumbChevron } from '../../common/base/bread-crumb-chevron.tsx';
import { isFootPathForLeg } from '../../../util/journey-utils.ts';
import { BackendInterpretationResult, EnrichedDeviation, isShown } from '../../../types/deviations-common.ts';
import { Leg, Transportation } from '../../../types/sl-journeyplaner-responses.ts';

type LegWithTransportation = { transportation: Transportation; leg: Leg };

export type Props = {
  legs: Leg[];
  deviationEnrichment: Map<string, BackendInterpretationResult>;
}

function convertLegsToProducts(legs: Leg[]): LegWithTransportation[] {
  const result: LegWithTransportation[] = [];

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (!leg?.transportation?.product) {
      continue;
    }
    if (isFootPathForLeg(leg) && i !== 0) {
      // Skip icons for interchange
      continue;
    }
    result.push({ transportation: leg.transportation, leg });
  }
  return result;
}

function legHasDeviation(leg: Leg, deviationEnrichment: Map<string, BackendInterpretationResult>): boolean {
  return convertInfoMessages(leg.infos ?? []).some(common => {
    const result = deviationEnrichment.get(common.message);
    return result !== undefined && isShown({ ...common, ...result } as EnrichedDeviation);
  });
}

function LegItem({ item, deviationEnrichment }: { item: LegWithTransportation; deviationEnrichment: Map<string, BackendInterpretationResult> }) {
  return (
    <div className="flex items-center gap-1">
      <LineTransportation transpo={item.transportation} />
      {legHasDeviation(item.leg, deviationEnrichment) && (
        <IoWarningOutline size={20} className="deviation-color mt-0.5" />
      )}
    </div>
  );
}

export function SldBreadCrumbs({ legs, deviationEnrichment }: Props) {
  const items = convertLegsToProducts(legs);
  const compact = items.length >= 4;
  const collapse = items.length >= 5;

  const visibleItems: (LegWithTransportation | 'ellipsis')[] = collapse
    ? [items[0], items[1], 'ellipsis', items[items.length - 1]]
    : items;

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {visibleItems.map((item, index) => (
        <React.Fragment key={index}>
          {item === 'ellipsis' ? (
            <span className="text-gray-400 text-sm leading-none">…</span>
          ) : (
            <LegItem item={item} deviationEnrichment={deviationEnrichment} />
          )}
          {index < visibleItems.length - 1 && <BreadCrumbChevron />}
        </React.Fragment>
      ))}
    </div>
  );
}

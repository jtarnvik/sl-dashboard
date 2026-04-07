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

export function SldBreadCrumbs({ legs, deviationEnrichment }: Props) {
  const items = convertLegsToProducts(legs);

  return (
    <div className="flex gap-2 items-center">
      {items.map((item, index) => {
        return (
          <React.Fragment key={index}>
            <div className="relative">
              <LineTransportation transpo={item.transportation} />
              {legHasDeviation(item.leg, deviationEnrichment) && (
                <IoWarningOutline size={12} className="absolute -top-1 -right-1 deviation-color" />
              )}
            </div>
            {index < items.length - 1 && (
              <BreadCrumbChevron />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

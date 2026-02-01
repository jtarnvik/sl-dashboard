import React from 'react';
import {Leg, Transportation} from "../../types/sl-journeyplaner-responses.ts";
import {LineTransportation} from "../common/line";
import {BreadCrumbChevron} from "../common/base/bread-crumb-chevron.tsx";
import {isFootPathForLeg} from "../../util/journey-utils.ts";

export type Props = {
  legs: Leg[]
}

function convertLegsToProducts(legs: Leg[]) {
  const result: Transportation[] = [];

  for (let i = 0; i < legs.length; i++) {
    let leg = legs[i];
    if (!leg?.transportation?.product) {
      continue;
    }
    if (isFootPathForLeg(leg) && i !== 0) {
      // Skip icons for interchange
      continue;
    }
    result.push(leg.transportation);
  }
  return result;
}

export function SldBreadCrumbs({legs}: Props) {
  const transpos = convertLegsToProducts(legs);

  return (
    <div className="flex gap-2 items-center">
      {transpos.map((transpo, index) => {
        return (
          <React.Fragment key={index}>
            <LineTransportation transpo={transpo} />
            {index < transpos.length - 1 && (
              <BreadCrumbChevron />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
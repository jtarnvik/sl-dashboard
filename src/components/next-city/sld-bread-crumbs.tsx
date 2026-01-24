import React from 'react';
import {Leg, PRODUCT_CLASS_FOOTPATH, Transportation} from "../../types/sl-journeyplaner-responses.ts";
import {LineTransportation} from "../common/line";
import { IoChevronForward } from "react-icons/io5";

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
    if (leg.transportation.product.class === PRODUCT_CLASS_FOOTPATH && i !== 0) {
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
              <IoChevronForward className="w-4 h-4 mt-[4px]" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
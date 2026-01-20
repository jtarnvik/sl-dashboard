import React from 'react';
import {Leg, Product, PRODUCT_CLASS_FOOTPATH} from "../../types/sl-journeyplaner-responses.ts";
import {TransportationIcon} from "../common/line";
import { IoChevronForward } from "react-icons/io5";

export type Props = {
  legs: Leg[]
}

function convertLegsToIcons(legs: Leg[]) {
  const result: Product[] = [];

  for (let i = 0; i < legs.length; i++) {
    let leg = legs[i];
    if (!leg?.transportation?.product) {
      continue;
    }
    if (leg.transportation.product.class === PRODUCT_CLASS_FOOTPATH && i !== 0) {
      // Skip icons for interchange
      continue;
    }
    result.push(leg.transportation.product);
  }
  return result;
}

export function SldBreadCrumbs({legs}: Props) {
  var numbers = convertLegsToIcons(legs);

  return (
    <div className="flex gap-2 items-center">
      {numbers.map((number, index) => {
        return (
          <React.Fragment key={index}>
            <TransportationIcon product={number} />
            {index < numbers.length - 1 && (
              <IoChevronForward className="w-4 h-4 mt-[4px]" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
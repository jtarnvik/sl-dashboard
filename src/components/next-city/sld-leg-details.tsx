import {Leg, PRODUCT_CLASS_FOOTPATH} from "../../types/sl-journeyplaner-responses.ts";
import React, {JSX} from "react";
import {SldWalk} from "./sld-walk.tsx";
import {SldInterchange} from "./sld-interchange.tsx";
import {SldLeg} from "./sld-leg.tsx";

type GeneralLegComponentProps = {
  leg: Leg,
  index: number
}

function GeneralLegComponent({leg, index}: GeneralLegComponentProps): JSX.Element {
  if (leg.transportation?.product.class === PRODUCT_CLASS_FOOTPATH) {
    if (index === 0) {
      return (<SldWalk leg={leg} />);
    } else {
      return (<SldInterchange leg={leg} />);
    }
  } else {
    return (<SldLeg leg={leg} />);
  }
}

type Props = {
  legs: Leg[]
}

export function SldLegDetails({legs}: Props) {
  return (
    <div className="bg-[#F8F9FA] border border-gray-200 shadow-sm rounded-md rounded-t-none p-[10px] ms-[10px] me-[10px] mb-2">
      {legs.map((leg, index) => {
        return (
          <React.Fragment key={index}>
            <GeneralLegComponent leg={leg} index={index} />
            {index < legs.length - 1 && (
              <hr className="border-0 border-t-2 border-gray-300 mx-1 my-2" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
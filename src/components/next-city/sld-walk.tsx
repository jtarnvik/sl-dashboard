import {Leg} from "../../types/sl-journeyplaner-responses";

type Props = {
  leg: Leg
}

export function SldWalk({leg}:Props) {
  return (<div>walk {leg.origin.type}</div>);
}
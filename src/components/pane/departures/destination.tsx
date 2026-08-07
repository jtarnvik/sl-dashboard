import classNames from "classnames";
import {Journey} from "../../../types/sl-responses.ts";
import {JourneyStyling, stylingForJourney} from "../../../util/journey-state.ts";

type Props = {
  journey: Journey,
  destination: string
}

export function Destination({journey, destination}: Props) {
  const styling = stylingForJourney(journey);

  const destinationStyling = classNames({
    'line-through': styling === JourneyStyling.CANCELLED,
    'text-gray-400': styling === JourneyStyling.PLANNED,
    'no-styling1': styling === JourneyStyling.EN_ROUTE,
    'text-red-900': styling === JourneyStyling.UNKNOWN,
    'no-styling2': styling === JourneyStyling.DONE,
  });

  return (
    <div className={destinationStyling}>{destination}</div>
  );
}

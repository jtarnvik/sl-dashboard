import classNames from "classnames";

type Props = {
  journey: Journey,
  destination: string
}

export function Destination({journey, destination}: Props) {
  enum DestinationStyling {
    CANCELLED,
    PLANNED,
    EN_ROUTE,
    UNKNOWN,
    DONE
  };

  function journeyStateToStyling(state: JourneyState) {
    switch (state) {
      // @formatter:off
      case "NOTEXPECTED":      return DestinationStyling.CANCELLED;
      case "NOTRUN":           return DestinationStyling.CANCELLED;
      case "EXPECTED":         return DestinationStyling.PLANNED;
      case "ASSIGNED":         return DestinationStyling.PLANNED;
      case "CANCELLED":        return DestinationStyling.CANCELLED;
      case "SIGNEDON":         return DestinationStyling.PLANNED;
      case "ATORIGIN":         return DestinationStyling.PLANNED;
      case "FASTPROGRESS":     return DestinationStyling.EN_ROUTE;
      case "NORMALPROGRESS":   return DestinationStyling.EN_ROUTE;
      case "SLOWPROGRESS":     return DestinationStyling.EN_ROUTE;
      case "NOPROGRESS":       return DestinationStyling.EN_ROUTE;
      case "OFFROUTE":         return DestinationStyling.CANCELLED;
      case "ABORTED":          return DestinationStyling.CANCELLED;
      case "COMPLETED":        return DestinationStyling.DONE;
      case "ASSUMEDCOMPLETED": return DestinationStyling.DONE;
      // @formatter:on
    }
  }

  let styling: DestinationStyling;
  if (!journey?.state) {
    styling = DestinationStyling.UNKNOWN;
  } else {
    styling = journeyStateToStyling(journey.state);
  }

  const destinationStyling = classNames({
    'line-through': styling === DestinationStyling.CANCELLED,
    'text-gray-400': styling === DestinationStyling.PLANNED,
    'no-styling1': styling === DestinationStyling.EN_ROUTE,
    'text-red-900': styling === DestinationStyling.UNKNOWN,
    'no-styling2': styling === DestinationStyling.DONE,
  });

  return (
    <div className={destinationStyling}>{destination}</div>
  );
}



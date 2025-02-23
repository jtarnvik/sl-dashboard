import {TbBus} from "react-icons/tb";
import { TbBusStop } from "react-icons/tb";
import {TbTrain} from "react-icons/tb";
import {PiSubway} from "react-icons/pi";
import {PiTram} from "react-icons/pi";
import {TbFerry} from "react-icons/tb";
import {PiTaxi} from "react-icons/pi";
import {TbUfo} from "react-icons/tb";
import classNames from "classnames";

type TIProps = {
  line: Line,
  journey: Journey
}

function TransportationIcon({line, journey}: TIProps) {
  if (line.transport_mode === "BUS") {
    if (journey?.state === "ATORIGIN") {
      return (<TbBusStop className="mt-[4px] ms-[0px]" />);
    } else {
      return (<TbBus className="mt-[4px] ms-[0px]" />);
    }
  } else if (line.transport_mode === "METRO") {
    return (<PiSubway className="mt-[4px]" />);
  } else if (line.transport_mode === "TRAIN") {
    return (<TbTrain className="mt-[4px]" />);
  } else if (line.transport_mode === "TRAM") {
    return (<PiTram className="mt-[4px]" />);
  } else if (line.transport_mode === "FERRY") {
    return (<TbFerry className="mt-[4px]" />);
  } else if (line.transport_mode === "SHIP") {
    return (<TbFerry className="mt-[4px]" />);
  } else if (line.transport_mode === "TAXI") {
    return (<PiTaxi className="mt-[4px]" />);
  } else {
    return (<TbUfo className="mt-[4px]" />);
  }
}

type Props = {
  line: Line ,
  journey: Journey
}

function journeyToLines(journey: Journey):number {
  switch (journey?.state) {
    case "FASTPROGRESS": return 3;
    case "NORMALPROGRESS": return 2;
    case "SLOWPROGRESS": return 1;
    default: return 0;
  }
}

export function Line({line, journey}: Props) {
  const lineAdjustment = classNames({
    'mt-[9px]' :  journey?.state === "FASTPROGRESS",
    'mt-[11px]' : journey?.state === "NORMALPROGRESS",
    'mt-[13px]' : journey?.state === "SLOWPROGRESS",
  });

  return (
    <div>
    <div className="flex space-x-1">
      <div className="flex space-x-[2px]">
        <div className={"flex flex-col space-y-0.5 w-[9px] items-end " + lineAdjustment}>
          {Array.from({length: journeyToLines(journey)}).map((_, index) => {
            return (
            <div
              key={index}
              className={"bg-black h-px "}
              style={{
                width: `${(index + 1) * 3}px`, // Creates the stair effect
              }}
            />
          );})}
        </div>
        <TransportationIcon line={line} journey={journey}/>
      </div>
      <div
        className="font-signage bg-black text-white font-extrabold px-[3px] leading-[12px] pt-[2px] mt-[4px]">
        {line.designation}
      </div>
    </div>
    </div>
  );
}
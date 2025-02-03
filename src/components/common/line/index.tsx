import {TbBus} from "react-icons/tb";
import {TbTrain} from "react-icons/tb";
import {PiSubway} from "react-icons/pi";
import {PiTram} from "react-icons/pi";
import {TbFerry} from "react-icons/tb";
import {PiTaxi} from "react-icons/pi";
import {TbUfo} from "react-icons/tb";

type TIProps = {
  line: Line
}

function TransportationIcon({line}: TIProps) {
  if (line.transport_mode === "BUS") {
    return (<TbBus className="mt-[4px]" />);
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
  line: Line
}

export function Line({line}: Props) {
  return (
    <div className="flex space-x-1">
      <TransportationIcon line={line} />
      <div
        className="px-[3px] font-signage bg-black text-white font-extrabold pt-[2px] pb-[2px] leading-[calc(1em-4px)] mt-[4px]">
        {line.designation}
      </div>
    </div>
  );
}
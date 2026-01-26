import {TbBus} from "react-icons/tb";
import {TbBusStop} from "react-icons/tb";
import {TbTrain} from "react-icons/tb";
import {PiSubway} from "react-icons/pi";
import {PiTram} from "react-icons/pi";
import {TbFerry} from "react-icons/tb";
import {PiTaxi} from "react-icons/pi";
import {TbUfo} from "react-icons/tb";
import {LiaWalkingSolid} from "react-icons/lia";
import classNames from "classnames";
import {PRODUCT_CLASS_BUS, PRODUCT_CLASS_BUS_LOCAL, PRODUCT_CLASS_FOOTPATH, PRODUCT_CLASS_FOOTPATH_2, PRODUCT_CLASS_SUBWAY, PRODUCT_CLASS_TRAIN, Transportation} from "../../../types/sl-journeyplaner-responses.ts";

export enum SldProgress {
  FAST = 1,
  NORMAL,
  SLOW,
  NO_INFO
}

function progressToLines(progress: SldProgress): number {
  switch (progress) {
    case SldProgress.FAST:
      return 3;
    case SldProgress.NORMAL:
      return 2;
    case SldProgress.SLOW:
      return 1;
    default:
      return 0;
  }
}

export enum TransportationMode {
  BUS,
  BUS_AT_STOPPOINT,
  TRAIN,
  SUBWAY,
  TRAM,
  FERRY,
  SHIP,
  TAXI,
  WALKING,
  UNKNOWN
}

type TransportationIconCommonProps = {
  mode: TransportationMode,
  className?: string
}

export function TransportationIconCommon({mode, className = ""}: TransportationIconCommonProps) {
  if (mode === TransportationMode.BUS_AT_STOPPOINT) {
    return (<TbBusStop className={className + " ms-[0px]"} />);
  } else if (mode === TransportationMode.BUS) {
    return (<TbBus className={className + " ms-[0px]"} />);
  } else if (mode === TransportationMode.SUBWAY) {
    return (<PiSubway className={className} />);
  } else if (mode === TransportationMode.TRAIN) {
    return (<TbTrain className={className} />);
  } else if (mode === TransportationMode.TRAM) {
    return (<PiTram className={className} />);
  } else if (mode === TransportationMode.FERRY) {
    return (<TbFerry className={className} />);
  } else if (mode === TransportationMode.SHIP) {
    return (<TbFerry className={className} />);
  } else if (mode === TransportationMode.TAXI) {
    return (<PiTaxi className={className} />);
  } else if (mode === TransportationMode.WALKING) {
    return (<LiaWalkingSolid className={className} />);
  } else {
    return (<TbUfo className={className} />);
  }
}

export function convertLineJourneyToTransportionMode(line: Line, journey: Journey): TransportationMode {
  if (line?.transport_mode === "BUS") {
    if (journey?.state === "ATORIGIN") {
      return TransportationMode.BUS_AT_STOPPOINT;
    } else {
      return TransportationMode.BUS;
    }
  } else if (line?.transport_mode === "METRO") {
    return TransportationMode.SUBWAY;
  } else if (line?.transport_mode === "TRAIN") {
    return TransportationMode.TRAIN;
  } else if (line?.transport_mode === "TRAM") {
    return TransportationMode.TRAM;
  } else if (line?.transport_mode === "FERRY") {
    return TransportationMode.FERRY;
  } else if (line?.transport_mode === "SHIP") {
    return TransportationMode.SHIP;
  } else if (line?.transport_mode === "TAXI") {
    return TransportationMode.TAXI;
  } else {
    return TransportationMode.UNKNOWN;
  }
}

export function convertTransportationToTransportationMode(transpo: Transportation): TransportationMode {
  switch (transpo?.product?.class) {
    case PRODUCT_CLASS_BUS:
    case PRODUCT_CLASS_BUS_LOCAL:
      return TransportationMode.BUS;
    case PRODUCT_CLASS_SUBWAY:
      return TransportationMode.SUBWAY;
    case PRODUCT_CLASS_TRAIN:
      return TransportationMode.TRAIN;
    case PRODUCT_CLASS_FOOTPATH:
    case PRODUCT_CLASS_FOOTPATH_2:
      return TransportationMode.WALKING;
  }
  return TransportationMode.UNKNOWN;
}

export function convertJourneyToProgress(journey: Journey) {
  switch (journey?.state) {
    case "FASTPROGRESS":
      return SldProgress.FAST;
    case "NORMALPROGRESS":
      return SldProgress.NORMAL;
    case "SLOWPROGRESS":
      return SldProgress.SLOW;
    default:
      return SldProgress.NO_INFO;
  }
}

type LineCommonProps = {
  mode: TransportationMode,
  progress?: SldProgress,
  designation: string,
  forceProgressUsage?: boolean
}

export function LineCommon({mode, progress = SldProgress.NO_INFO, designation, forceProgressUsage = false}: LineCommonProps) {
  const lineAdjustment = classNames({
    'mt-[9px]': progress === SldProgress.FAST,
    'mt-[11px]': progress === SldProgress.NORMAL,
    'mt-[13px]': progress === SldProgress.SLOW,
  });

  return (
    <div>
      <div className="flex space-x-1">
        <div className="flex space-x-[2px]">
          {(progress !== SldProgress.NO_INFO || forceProgressUsage) &&
            <div className={"flex flex-col space-y-0.5 w-[9px] items-end " + lineAdjustment}>
              {Array.from({length: progressToLines(progress)}).map((_, index) => {
                return (
                  <div
                    key={index}
                    className={"bg-black h-px "}
                    style={{
                      width: `${(index + 1) * 3}px`, // Creates the stair effect
                    }}
                  />
                );
              })}
            </div>
          }
          <TransportationIconCommon mode={mode} className="mt-[4px]" />
        </div>
        {mode !== TransportationMode.WALKING && mode !== TransportationMode.UNKNOWN &&
          <div className="font-signage bg-black text-white font-extrabold px-[3px] leading-[12px] pt-[2px] mt-[4px]">
            {designation}
          </div>
        }
      </div>
    </div>
  );
}

type PropsLineJourney = {
  line: Line,
  journey: Journey
  useProgress?: boolean
}

export function LineJourney({line, journey}: PropsLineJourney) {
  const progress = convertJourneyToProgress(journey);
  const transportationMode = convertLineJourneyToTransportionMode(line, journey);
  const designation = line.designation;

  return (<LineCommon mode={transportationMode} progress={progress} designation={designation} forceProgressUsage={true} />);
}

type PropsLineProduct = {
  transpo: Transportation,
}

export function LineTransportation({transpo}: PropsLineProduct) {

  const transportationMode = convertTransportationToTransportationMode(transpo);
  const designation = transpo.disassembledName || "";

  return (<LineCommon mode={transportationMode} designation={designation} />);
}
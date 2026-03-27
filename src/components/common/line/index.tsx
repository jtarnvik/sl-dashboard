import {TbBus} from "react-icons/tb";
import {TbBusStop} from "react-icons/tb";
import {TbTrain} from "react-icons/tb";
import {PiSubwayBold} from "react-icons/pi";
import {PiTramBold} from "react-icons/pi";
import {TbFerry} from "react-icons/tb";
import {PiTaxi} from "react-icons/pi";
import {TbUfo} from "react-icons/tb";
import {LiaWalkingSolid} from "react-icons/lia";
import classNames from "classnames";
import {PRODUCT_CLASS_BUS, PRODUCT_CLASS_BUS_LOCAL, PRODUCT_CLASS_FOOTPATH, PRODUCT_CLASS_FOOTPATH_2, PRODUCT_CLASS_SUBWAY, PRODUCT_CLASS_TRAIN, PRODUCT_CLASS_TRAM, Transportation} from "../../../types/sl-journeyplaner-responses.ts";
import {Journey, Line} from "../../../types/sl-responses.ts";
import "./index.css";

export enum SldProgress {
  FAST = 1,
  NORMAL,
  SLOW,
  NO_INFO
}

export function getColorRef(mode: TransportationMode, designation: string) {
  if (mode === TransportationMode.TRAIN) {
    return "#CC417F";
  } else if (mode === TransportationMode.SUBWAY) {
    switch (designation) {
      case "10":
      case "11":
        return "#0079C1";
      case "13":
      case "14" :
        return "#D71D24";
      case "17":
      case "18":
      case "19" :
        return "#009640";
    }
    return "#000000";
  } else if (mode === TransportationMode.TRAM) {
    switch (designation) {
      case "7":
        return "#4B4F54";
      case "12":
        return "#F17F11";
      case "21":
        return "#7A4A29";
      case "30":
      case "31":
        return "#838688";
    }
    return "#000000";
  } else {
    return "#000000";
  }
}

function getBadgeShapeClass(mode: TransportationMode): string {
  switch (mode) {
    case TransportationMode.TRAIN:
      return "rounded-full";
    case TransportationMode.SUBWAY:
      return "rounded-xs";
    case TransportationMode.TRAM:
      return "tram-badge-bulge";
    default:
      return "";
  }
}

type LineDesignationBadgeProps = {
  designation: string,
  mode: TransportationMode,
  className?: string,
}

function LineDesignationBadge({designation, mode, className = ""}: LineDesignationBadgeProps) {
  const backgroundColor = getColorRef(mode, designation);

  const normalized = (designation ?? "").trim();
  const lastChar = normalized.slice(-1);
  const hasLetterSuffix = normalized.length > 1 && /[A-Z]/i.test(lastChar) && /^\d+[A-Z]$/i.test(normalized);
  const base = hasLetterSuffix ? normalized.slice(0, -1) : normalized;
  const suffix = hasLetterSuffix ? lastChar.toUpperCase() : null;

  const badgeClasses = classNames("font-signage text-white font-extrabold w-[40px] text-center leading-[16px] pt-px mt-[3px]",
    className, getBadgeShapeClass(mode));

  return (
    <div
      className={badgeClasses}
      style={{backgroundColor}}
    >
      {suffix ? (
        <>
          {base}
          <sup className="text-[10px] leading-none">{suffix}</sup>
        </>
      ) : (
        normalized
      )}
    </div>
  );
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
  inlineStyle?: React.CSSProperties
}

export function TransportationIconCommon({mode, className = "", inlineStyle}: TransportationIconCommonProps) {
  if (mode === TransportationMode.BUS_AT_STOPPOINT) {
    return (<TbBusStop className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.BUS) {
    return (<TbBus className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.SUBWAY) {
    return (<PiSubwayBold className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.TRAIN) {
    return (<TbTrain className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.TRAM) {
    return (<PiTramBold className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.FERRY) {
    return (<TbFerry className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.SHIP) {
    return (<TbFerry className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.TAXI) {
    return (<PiTaxi className={className} style={inlineStyle} />);
  } else if (mode === TransportationMode.WALKING) {
    return (<LiaWalkingSolid className={className} style={inlineStyle} />);
  } else {
    return (<TbUfo className={className} style={inlineStyle} />);
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
    case PRODUCT_CLASS_TRAM:
      return TransportationMode.TRAM;
    case PRODUCT_CLASS_TRAIN:
      return TransportationMode.TRAIN;
    case PRODUCT_CLASS_FOOTPATH:
    case PRODUCT_CLASS_FOOTPATH_2:
      return TransportationMode.WALKING;
  }
  console.log("Unknown transportation class: ", transpo?.product);
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
  forceProgressUsage?: boolean,
  hideDesignation?: boolean,
  extraIconClass?: string,
}

export function LineCommon({mode, progress = SldProgress.NO_INFO, designation, forceProgressUsage = false, hideDesignation = false, extraIconClass = ""}: LineCommonProps) {
  const lineAdjustment = classNames({
    'mt-[9px]': progress === SldProgress.FAST,
    'mt-[11px]': progress === SldProgress.NORMAL,
    'mt-[13px]': progress === SldProgress.SLOW,
  });

  return (
    <div>
      <div className="flex space-x-1">
        <div className={"flex space-x-[2px] " + extraIconClass}>
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
          <TransportationIconCommon mode={mode} className="mt-[2px] w-[20px] h-[20px]" />
        </div>
        {!hideDesignation && mode !== TransportationMode.WALKING && mode !== TransportationMode.UNKNOWN &&
          <LineDesignationBadge
            designation={designation}
            mode={mode}
          />
        }
      </div>
    </div>
  );
}

// work on designation shaps and color, is the width OK?
type PropsLineJourney = {
  line: Line,
  journey: Journey
  useProgress?: boolean,
  hideDesignation?: boolean,
  extraIconClass?: string,
}

export function LineJourney({line, journey, hideDesignation, extraIconClass}: PropsLineJourney) {
  const progress = convertJourneyToProgress(journey);
  const transportationMode = convertLineJourneyToTransportionMode(line, journey);
  const designation = line.designation;

  return (<LineCommon
    mode={transportationMode}
    progress={progress}
    designation={designation}
    forceProgressUsage={true}
    hideDesignation={hideDesignation}
    extraIconClass={extraIconClass}
  />);
}

type PropsLineProduct = {
  transpo: Transportation,
  hideDesignation?: boolean,
  extraIconClass?: string,
}

export function LineTransportation({transpo, hideDesignation, extraIconClass}: PropsLineProduct) {

  const transportationMode = convertTransportationToTransportationMode(transpo);
  const designation = transpo.disassembledName || "";

  return (<LineCommon
    mode={transportationMode}
    designation={designation}
    hideDesignation={hideDesignation}
    extraIconClass={extraIconClass}
  />);
}
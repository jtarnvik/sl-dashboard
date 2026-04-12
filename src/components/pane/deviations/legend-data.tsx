import {TransportationIconCommon, TransportationMode} from "../../common/line";

const iconClass = "w-[24px] h-[24px] p-[3px] rounded-sm text-white";
const ORANGE = "#F97316";

export const normalIcons: { symbol: React.ReactNode; legend: React.ReactNode }[] = [
  {
    symbol: <TransportationIconCommon mode={TransportationMode.TRAIN} className={iconClass} inlineStyle={{backgroundColor: "#CC417F"}} />,
    legend: <div>Pendeltåg, hanterar linje 43/44 med hållplats-info från Spånga till Centralen</div>,
  },
  {
    symbol: <TransportationIconCommon mode={TransportationMode.SUBWAY} className={iconClass} inlineStyle={{backgroundColor: "#009640"}} />,
    legend: <div>Tunnelbana, hanterar linje 17/18/19 med hållplats-info från Brommplan till Gamla Stan</div>,
  },
  {
    symbol: <TransportationIconCommon mode={TransportationMode.BUS} className={iconClass} inlineStyle={{backgroundColor: "#000000"}} />,
    legend: <div>Buss, hanterar linje 117</div>,
  },
];

export const deviationIcons: { symbol: React.ReactNode; legend: React.ReactNode }[] = [
  {
    symbol: <TransportationIconCommon mode={TransportationMode.TRAIN} className={iconClass} inlineStyle={{backgroundColor: ORANGE}} />,
    legend: <div>Pendeltåg – klicka för att se avvikelser</div>,
  },
  {
    symbol: <TransportationIconCommon mode={TransportationMode.SUBWAY} className={iconClass} inlineStyle={{backgroundColor: ORANGE}} />,
    legend: <div>Tunnelbana – klicka för att se avvikelser</div>,
  },
  {
    symbol: <TransportationIconCommon mode={TransportationMode.BUS} className={iconClass} inlineStyle={{backgroundColor: ORANGE}} />,
    legend: <div>Buss – klicka för att se avvikelser</div>,
  },
];
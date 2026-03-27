import {useContext, useEffect, useRef, useState} from "react";
import classNames from "classnames";
import {DEVIATION_FOCUS_STOPS_BUS, DEVIATION_FOCUS_STOPS_SUBWAY, DEVIATION_FOCUS_STOPS_TRAIN, URL_GET_DEVIATION_BUS, URL_GET_DEVIATION_SUBWAY, URL_GET_DEVIATION_TRAIN} from "../../../communication/constant.ts";
import {fetchAbortable} from "../../../communication/fetch-abortable.ts";
import {convertDeviationSearch, DeviationModal, filterDeviationsByStops} from "../../common/deviation-modal";
import {Card} from "../../common/card";
import {getColorRef, TransportationIconCommon, TransportationMode} from "../../common/line";
import {ModalDialog} from "../../common/modal-dialog";
import {SLButton} from "../../common/sl-button";
import InDebugModeContext from "../../../contexts/debug-context.ts";
import {Legend} from "../departures/legend.tsx";
import {AbortControllerState} from "../../../types/communication.ts";
import {Deviation} from "../../../types/deviations.ts";
import {deviationIcons, normalIcons} from "./legend-data.tsx";
import ErrorContext from "../../../contexts/error-context.ts";

/**
 * Aktuella pendeltåg: 43, 43X, 44
 * https://deviations.integration.sl.se/v1/messages?future=false&line=43&line=44&transport_mode=TRAIN
 * Aktuella busslinjer: 117
 * https://deviations.integration.sl.se/v1/messages?future=false&line=117&transport_mode=BUS
 * Aktuella tunnelbanor: 17, 18, 19
 * https://deviations.integration.sl.se/v1/messages?future=false&line=17&line=18&line=19&transport_mode=METRO
 */
export function Deviations() {
  const {inDebugMode} = useContext(InDebugModeContext);
  const {setError} = useContext(ErrorContext);

  const latestBusRequest = useRef<AbortControllerState | undefined>(undefined);
  const latestTrainRequest = useRef<AbortControllerState | undefined>(undefined);
  const latestSubwayRequest = useRef<AbortControllerState | undefined>(undefined);

  const [busDeviations, setBusDeviations] = useState<Deviation[]>([]);
  const [trainDeviations, setTrainDeviations] = useState<Deviation[]>([]);
  const [subwayDeviations, setSubwayDeviations] = useState<Deviation[]>([]);

  const [busInProgress, setBusInProgress] = useState<boolean>(true);
  const [trainInProgress, setTrainInProgress] = useState<boolean>(true);
  const [subwayInProgress, setSubwayInProgress] = useState<boolean>(true);

  const [openModal, setOpenModal] = useState<'bus' | 'train' | 'subway' | null>(null);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAbortable<Deviation[]>(URL_GET_DEVIATION_BUS, latestBusRequest,
      (data) => { setBusDeviations(data); setBusInProgress(false); },
      (error, retry) => { setBusInProgress(false); setError(error, retry); }
    );
  }, [setError]);
  useEffect(() => {
    fetchAbortable<Deviation[]>(URL_GET_DEVIATION_TRAIN, latestTrainRequest,
      (data) => { setTrainDeviations(data); setTrainInProgress(false); },
      (error, retry) => { setTrainInProgress(false); setError(error, retry); }
    );
  }, [setError]);
  useEffect(() => {
    fetchAbortable<Deviation[]>(URL_GET_DEVIATION_SUBWAY, latestSubwayRequest,
      (data) => { setSubwayDeviations(data); setSubwayInProgress(false); },
      (error, retry) => { setSubwayInProgress(false); setError(error, retry); }
    );
  }, [setError]);

  const trainDeviationInfos = convertDeviationSearch(filterDeviationsByStops(trainDeviations, DEVIATION_FOCUS_STOPS_TRAIN), DEVIATION_FOCUS_STOPS_TRAIN);
  const subwayDeviationInfos = convertDeviationSearch(filterDeviationsByStops(subwayDeviations, DEVIATION_FOCUS_STOPS_SUBWAY), DEVIATION_FOCUS_STOPS_SUBWAY);
  const busDeviationInfos = convertDeviationSearch(filterDeviationsByStops(busDeviations, DEVIATION_FOCUS_STOPS_BUS), DEVIATION_FOCUS_STOPS_BUS);

  // style={{ backgroundColor: modeColor, color: '#FFFFFF' }}

  const commonAdjustments = classNames(
    "w-[24px] h-[24px] p-[3px]",
    "rounded-sm", "text-white");
  const busAdjustments = classNames(commonAdjustments,
    {"cursor-pointer": busDeviationInfos.length > 0});
  const subwayAdjustments = classNames(commonAdjustments,
    {"cursor-pointer": subwayDeviationInfos.length > 0});
  const trainAdjustments = classNames(commonAdjustments,
    {"cursor-pointer": trainDeviationInfos.length > 0});

  function getModeBackgroundColor(mode: TransportationMode, designation: string, inProgress: boolean, hasDeviations: boolean): { backgroundColor: string } {
    if (inProgress) {
      return {backgroundColor: "bg-gray-400"};
    }
    if (hasDeviations) {
      return {backgroundColor: "#F97316"};
    }
    return {backgroundColor: getColorRef(mode, designation)};
  }

  return (
    <Card>
      <div className="flex justify-between">
        <div onClick={() => { if (trainDeviationInfos.length > 0) { setOpenModal('train'); } }}>
          <TransportationIconCommon
            mode={TransportationMode.TRAIN}
            className={trainAdjustments}
            inlineStyle={getModeBackgroundColor(TransportationMode.TRAIN, "42", trainInProgress, trainDeviationInfos.length > 0)}
          />
        </div>
        <div onClick={() => { if (subwayDeviationInfos.length > 0) { setOpenModal('subway'); } }}>
          <TransportationIconCommon
            mode={TransportationMode.SUBWAY}
            className={subwayAdjustments}
            inlineStyle={getModeBackgroundColor(TransportationMode.SUBWAY, "17", subwayInProgress, subwayDeviationInfos.length > 0)}
          />
        </div>
        <div onClick={() => { if (busDeviationInfos.length > 0) { setOpenModal('bus'); } }}>
          <TransportationIconCommon
            mode={TransportationMode.BUS}
            className={busAdjustments}
            inlineStyle={getModeBackgroundColor(TransportationMode.BUS, "117", busInProgress, busDeviationInfos.length > 0)}
          />
        </div>
      </div>
      <div className="w-full flex justify-end space-x-1 mt-2">
        {inDebugMode &&
          <SLButton onClick={() => {}} thin>JSON</SLButton>
        }
        <SLButton onClick={() => setLegendOpen(true)} thin>Symboler</SLButton>
      </div>
      <ModalDialog isOpen={legendOpen} onClose={() => setLegendOpen(false)} title="Symboler" scrollable={false}>
        <Legend legendData={normalIcons} title="Normalt läge"/>
        <Legend legendData={deviationIcons} title="Avvikelser finns"/>
      </ModalDialog>
      <DeviationModal
        open={openModal === 'train'}
        onClose={() => setOpenModal(null)}
        deviation={trainDeviationInfos}
      />
      <DeviationModal
        open={openModal === 'subway'}
        onClose={() => setOpenModal(null)}
        deviation={subwayDeviationInfos}
      />
      <DeviationModal
        open={openModal === 'bus'}
        onClose={() => setOpenModal(null)}
        deviation={busDeviationInfos}
      />
    </Card>
  );
}
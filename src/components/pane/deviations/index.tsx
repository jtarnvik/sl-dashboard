import {RefObject, useCallback, useContext, useEffect, useRef, useState} from "react";
import axios from "axios";
import classNames from "classnames";
import {DEVIATION_FOCUS_STOPS_BUS, DEVIATION_FOCUS_STOPS_SUBWAY, DEVIATION_FOCUS_STOPS_TRAIN, URL_GET_DEVIATION_BUS, URL_GET_DEVIATION_SUBWAY, URL_GET_DEVIATION_TRAIN} from "../../../communication/constant.ts";
import {convertDeviationSearch, DeviationModal, filterDeviationsByStops} from "../../common/deviation-modal";
import {Card} from "../../common/card";
import {getColorRef, TransportationIconCommon, TransportationMode} from "../../common/line";
import {ModalDialog} from "../../common/modal-dialog";
import {SLButton} from "../../common/sl-button";
import InDebugModeContext from "../../../contexts/debug-context.ts";
import {Legend} from "../departures/legend.tsx";
import {AbortControllerState, createAbortController, isAbortError} from "../../../types/communication.ts";
import {Deviation} from "../../../types/deviations.ts";
import {deviationIcons, normalIcons} from "./legend-data.tsx";

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

  const latestBusRequest = useRef<AbortControllerState | undefined>(undefined);
  const latestTrainRequest = useRef<AbortControllerState | undefined>(undefined);
  const latestSubwayRequest = useRef<AbortControllerState | undefined>(undefined);

  const [busDeviations, setBusDeviations] = useState<Deviation[]>([]);
  const [trainDeviations, setTrainDeviations] = useState<Deviation[]>([]);
  const [subwayDeviations, setSubwayDeviations] = useState<Deviation[]>([]);

  const [openModal, setOpenModal] = useState<'bus' | 'train' | 'subway' | null>(null);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  const getDeviations = useCallback((url: string, refAborter: RefObject<AbortControllerState>, setDeviation: React.Dispatch<React.SetStateAction<Deviation[]>>) => {
    if (refAborter.current) {
      refAborter.current.abort("Previous request contains stale data");
    }
    const controller = createAbortController();
    refAborter.current = controller;

    axios.get<Deviation[]>(url, {
      signal: controller.signal,
    })
      .then(function (response) {
        setDeviation(response.data);
        // console.log(response);
      })
      .catch(function (error) {
        // Treat aborts as "expected"
        if (isAbortError(error)) {
          return;
        }
        console.log("Axios error", error);
      })
      .finally(function () {
        // Clear ONLY if this request is still the latest one
        if (refAborter.current === controller) {
          refAborter.current = undefined;
        }
      })

  }, []);

  useEffect(() => {
    getDeviations(URL_GET_DEVIATION_BUS, latestBusRequest, setBusDeviations);
  }, []);
  useEffect(() => {
    getDeviations(URL_GET_DEVIATION_TRAIN, latestTrainRequest, setTrainDeviations);
  }, []);
  useEffect(() => {
    getDeviations(URL_GET_DEVIATION_SUBWAY, latestSubwayRequest, setSubwayDeviations);
  }, []);

  const busInProgress = latestBusRequest.current !== undefined;
  const subwayInProgress = latestSubwayRequest.current !== undefined;
  const trainInProgress = latestTrainRequest.current !== undefined;

  const filteredTrainDeviations = filterDeviationsByStops(trainDeviations, DEVIATION_FOCUS_STOPS_TRAIN);
  const filteredSubwayDeviations = filterDeviationsByStops(subwayDeviations, DEVIATION_FOCUS_STOPS_SUBWAY);
  const filteredBusDeviations = filterDeviationsByStops(busDeviations, DEVIATION_FOCUS_STOPS_BUS);

  // style={{ backgroundColor: modeColor, color: '#FFFFFF' }}

  const commonAdjustments = classNames(
    "w-[24px] h-[24px] p-[3px]",
    "rounded", "text-white");
  const busAdjustments = classNames(commonAdjustments,
    {"cursor-pointer": filteredBusDeviations.length > 0});
  const subwayAdjustments = classNames(commonAdjustments,
    {"cursor-pointer": filteredSubwayDeviations.length > 0});
  const trainAdjustments = classNames(commonAdjustments,
    {"cursor-pointer": filteredTrainDeviations.length > 0});

  function getModeBackgroundColor(mode: TransportationMode, designation: string, inProgress: boolean, deviations: Deviation[]): { backgroundColor: string } {
    if (inProgress) {
      return {backgroundColor: "bg-gray-400"};
    }
    if (deviations && deviations.length > 0) {
      return {backgroundColor: "#F97316"};
    }
    return {backgroundColor: getColorRef(mode, designation)};
  }

  return (
    <Card>
      <div className="flex justify-between">
        <div onClick={() => { if (filteredTrainDeviations.length > 0) { setOpenModal('train'); } }}>
          <TransportationIconCommon
            mode={TransportationMode.TRAIN}
            className={trainAdjustments}
            inlineStyle={getModeBackgroundColor(TransportationMode.TRAIN, "42", trainInProgress, filteredTrainDeviations)}
          />
        </div>
        <div onClick={() => { if (filteredSubwayDeviations.length > 0) { setOpenModal('subway'); } }}>
          <TransportationIconCommon
            mode={TransportationMode.SUBWAY}
            className={subwayAdjustments}
            inlineStyle={getModeBackgroundColor(TransportationMode.SUBWAY, "17", subwayInProgress, filteredSubwayDeviations)}
          />
        </div>
        <div onClick={() => { if (filteredBusDeviations.length > 0) { setOpenModal('bus'); } }}>
          <TransportationIconCommon
            mode={TransportationMode.BUS}
            className={busAdjustments}
            inlineStyle={getModeBackgroundColor(TransportationMode.BUS, "117", busInProgress, filteredBusDeviations)}
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
        deviation={convertDeviationSearch(filteredTrainDeviations, DEVIATION_FOCUS_STOPS_TRAIN)}
      />
      <DeviationModal
        open={openModal === 'subway'}
        onClose={() => setOpenModal(null)}
        deviation={convertDeviationSearch(filteredSubwayDeviations, DEVIATION_FOCUS_STOPS_SUBWAY)}
      />
      <DeviationModal
        open={openModal === 'bus'}
        onClose={() => setOpenModal(null)}
        deviation={convertDeviationSearch(filteredBusDeviations, DEVIATION_FOCUS_STOPS_BUS)}
      />
    </Card>
  );
}
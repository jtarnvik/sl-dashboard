import { useContext, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  DEVIATION_FOCUS_STOPS_BUS,
  DEVIATION_FOCUS_STOPS_SUBWAY,
  DEVIATION_FOCUS_STOPS_TRAIN,
  URL_GET_DEVIATION_BUS,
  URL_GET_DEVIATION_SUBWAY,
  URL_GET_DEVIATION_TRAIN,
} from '../../../communication/constant.ts';
import { fetchAbortable } from '../../../communication/fetch-abortable.ts';
import { interpretDeviations } from '../../../communication/backend.ts';
import { convertDeviationSearch, DeviationModal, filterDeviationsByStops } from '../../common/deviation-modal';
import { Card } from '../../common/card';
import { getColorRef, TransportationIconCommon, TransportationMode } from '../../common/line';
import { ScanningUnderline } from '../../common/scanning-underline';
import { MdInfoOutline } from 'react-icons/md';
import { ModalDialog } from '../../common/modal-dialog';
import { SLButton } from '../../common/sl-button';
import InDebugModeContext from '../../../contexts/debug-context.ts';
import { Legend } from '../departures/legend.tsx';
import { AbortControllerState } from '../../../types/communication.ts';
import { Deviation } from '../../../types/deviations.ts';
import { EnrichedDeviation, enrichDeviations, isShown, isValidDeviationText } from '../../../types/deviations-common.ts';
import { deviationIcons, normalIcons } from './legend-data.tsx';
import ErrorContext from '../../../contexts/error-context.ts';

/**
 * Aktuella pendeltåg: 43, 43X, 44
 * https://deviations.integration.sl.se/v1/messages?future=false&line=43&line=44&transport_mode=TRAIN
 * Aktuella busslinjer: 117
 * https://deviations.integration.sl.se/v1/messages?future=false&line=117&transport_mode=BUS
 * Aktuella tunnelbanor: 17, 18, 19
 * https://deviations.integration.sl.se/v1/messages?future=false&line=17&line=18&line=19&transport_mode=METRO
 */
export function Deviations() {
  const { inDebugMode } = useContext(InDebugModeContext);
  const { setError } = useContext(ErrorContext);

  const latestBusRequest = useRef<AbortControllerState | undefined>(undefined);
  const latestTrainRequest = useRef<AbortControllerState | undefined>(undefined);
  const latestSubwayRequest = useRef<AbortControllerState | undefined>(undefined);

  const [trainEnriched, setTrainEnriched] = useState<EnrichedDeviation[]>([]);
  const [subwayEnriched, setSubwayEnriched] = useState<EnrichedDeviation[]>([]);
  const [busEnriched, setBusEnriched] = useState<EnrichedDeviation[]>([]);

  const [busInProgress, setBusInProgress] = useState<boolean>(true);
  const [trainInProgress, setTrainInProgress] = useState<boolean>(true);
  const [subwayInProgress, setSubwayInProgress] = useState<boolean>(true);

  const [openModal, setOpenModal] = useState<'bus' | 'train' | 'subway' | null>(null);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  async function processDeviations(
    data: Deviation[],
    focusStops: number[],
    setEnriched: (deviations: EnrichedDeviation[]) => void,
    setInProgress: (inProgress: boolean) => void
  ) {
    const common = convertDeviationSearch(filterDeviationsByStops(data, focusStops), focusStops)
      .filter(d => isValidDeviationText(d.message));
    if (common.length === 0) {
      setEnriched([]);
      setInProgress(false);
      return;
    }
    const results = await interpretDeviations(common.map(d => d.message), setError);
    if (results) {
      const enriched = enrichDeviations(common, results);
      setEnriched(enriched.filter(isShown));
    }
    setInProgress(false);
  }

  useEffect(() => {
    fetchAbortable<Deviation[]>(URL_GET_DEVIATION_TRAIN, latestTrainRequest,
      (data) => processDeviations(data, DEVIATION_FOCUS_STOPS_TRAIN, setTrainEnriched, setTrainInProgress),
      (error, retry) => { setTrainInProgress(false); setError(error, retry); }
    );
  }, [setError]);

  useEffect(() => {
    fetchAbortable<Deviation[]>(URL_GET_DEVIATION_SUBWAY, latestSubwayRequest,
      (data) => processDeviations(data, DEVIATION_FOCUS_STOPS_SUBWAY, setSubwayEnriched, setSubwayInProgress),
      (error, retry) => { setSubwayInProgress(false); setError(error, retry); }
    );
  }, [setError]);

  useEffect(() => {
    fetchAbortable<Deviation[]>(URL_GET_DEVIATION_BUS, latestBusRequest,
      (data) => processDeviations(data, DEVIATION_FOCUS_STOPS_BUS, setBusEnriched, setBusInProgress),
      (error, retry) => { setBusInProgress(false); setError(error, retry); }
    );
  }, [setError]);

  useEffect(() => {
    function handleDeviationHidden(e: Event) {
      const id = (e as CustomEvent<{ id: number }>).detail.id;
      setTrainEnriched(prev => prev.filter(d => d.id !== id));
      setSubwayEnriched(prev => prev.filter(d => d.id !== id));
      setBusEnriched(prev => prev.filter(d => d.id !== id));
    }
    window.addEventListener('deviationHidden', handleDeviationHidden);
    return () => window.removeEventListener('deviationHidden', handleDeviationHidden);
  }, []);

  const commonAdjustments = classNames('w-[24px] h-[24px] p-[3px]', 'rounded-sm', 'text-white');
  const busAdjustments = classNames(commonAdjustments, { 'cursor-pointer': busEnriched.length > 0 });
  const subwayAdjustments = classNames(commonAdjustments, { 'cursor-pointer': subwayEnriched.length > 0 });
  const trainAdjustments = classNames(commonAdjustments, { 'cursor-pointer': trainEnriched.length > 0 });

  function getModeBackgroundColor(
    mode: TransportationMode,
    designation: string,
    hasDeviations: boolean
  ): { backgroundColor: string } {
    if (hasDeviations) {
      return { backgroundColor: '#F97316' };
    }
    return { backgroundColor: getColorRef(mode, designation) };
  }

  return (
    <Card>
      <div className="flex flex-col items-center gap-2">
        <div onClick={() => { if (trainEnriched.length > 0) { setOpenModal('train'); } }}>
          <ScanningUnderline active={trainInProgress} lineOffset={4}>
            <TransportationIconCommon
              mode={TransportationMode.TRAIN}
              className={trainAdjustments}
              inlineStyle={getModeBackgroundColor(TransportationMode.TRAIN, "42", trainEnriched.length > 0)}
            />
          </ScanningUnderline>
        </div>
        <div onClick={() => { if (subwayEnriched.length > 0) { setOpenModal('subway'); } }}>
          <ScanningUnderline active={subwayInProgress} lineOffset={3}>
            <TransportationIconCommon
              mode={TransportationMode.SUBWAY}
              className={subwayAdjustments}
              inlineStyle={getModeBackgroundColor(TransportationMode.SUBWAY, "17", subwayEnriched.length > 0)}
            />
          </ScanningUnderline>
        </div>
        <div onClick={() => { if (busEnriched.length > 0) { setOpenModal('bus'); } }}>
          <ScanningUnderline active={busInProgress} lineOffset={3}>
            <TransportationIconCommon
              mode={TransportationMode.BUS}
              className={busAdjustments}
              inlineStyle={getModeBackgroundColor(TransportationMode.BUS, "117", busEnriched.length > 0)}
            />
          </ScanningUnderline>
        </div>
        {inDebugMode &&
          <SLButton onClick={() => {}} thin>JSON</SLButton>
        }
        <SLButton onClick={() => setLegendOpen(true)} thin><MdInfoOutline className="h-5 w-4" /></SLButton>
      </div>
      <ModalDialog isOpen={legendOpen} onClose={() => setLegendOpen(false)} title="Symboler" scrollable={false}>
        <Legend legendData={normalIcons} title="Normalt läge" />
        <Legend legendData={deviationIcons} title="Avvikelser finns" />
      </ModalDialog>
      <DeviationModal
        open={openModal === 'train'}
        onClose={() => setOpenModal(null)}
        deviations={trainEnriched}
      />
      <DeviationModal
        open={openModal === 'subway'}
        onClose={() => setOpenModal(null)}
        deviations={subwayEnriched}
      />
      <DeviationModal
        open={openModal === 'bus'}
        onClose={() => setOpenModal(null)}
        deviations={busEnriched}
      />
    </Card>
  );
}

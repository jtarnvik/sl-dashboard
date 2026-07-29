import { TransportationMode } from '../components/common/line';

/** Maps the backend's TransportMode enum name onto the frontend icon enum. */
export function toTransportationMode(transportMode: string): TransportationMode {
  switch (transportMode) {
    case 'TRAIN': return TransportationMode.TRAIN;
    case 'BUS':   return TransportationMode.BUS;
    case 'METRO': return TransportationMode.SUBWAY;
    case 'TRAM':  return TransportationMode.TRAM;
    default:      return TransportationMode.UNKNOWN;
  }
}

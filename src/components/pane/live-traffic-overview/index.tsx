import { LiveStop, LiveTrip, LiveVehicle, RouteData } from '../../../types/backend';

type LiveTrafficOverviewProps = {
  routeData: RouteData | null;
}

/**
 * Where a vehicle is, in words: which two stops it sits between and how far along that segment it has come.
 * The percentage is of the current segment, not of the whole trip — see the I2 note in CLAUDE.md for how to
 * derive trip percentage from shapeDistTraveled if that is ever wanted.
 * <p>
 * The last stop in the chain has no following stop, so a vehicle there is reported as being at it.
 */
function describePosition(vehicle: LiveVehicle, stops: LiveStop[]): string {
  const from = stops[vehicle.segIdx];
  const to = stops[vehicle.segIdx + 1];
  if (!from) {
    return `okänt läge (segIdx ${vehicle.segIdx})`;
  }
  if (!to) {
    return `vid ${from.stopName}`;
  }
  const percent = Math.round(vehicle.segmentFraction * 100);
  return `${from.stopName} → ${to.stopName}, ${percent}% av delsträckan`;
}

/**
 * The vehicle's direction as both the raw id and where it is headed. The chain is normalized to one
 * direction, so a vehicle matching it runs towards the last stop and one that differs towards the first.
 */
function describeDirection(vehicle: LiveVehicle, liveTrip: LiveTrip): string {
  const stops = liveTrip.stops;
  const alongChain = vehicle.directionId === liveTrip.direction;
  const destination = alongChain ? stops[stops.length - 1] : stops[0];
  const destinationName = destination ? destination.stopName : 'okänd';
  return `riktning ${vehicle.directionId} (mot ${destinationName})`;
}

export function LiveTrafficOverview({ routeData }: LiveTrafficOverviewProps) {
  if (!routeData) {
    return <p className="text-sm text-gray-600">Hämtar trafikdata...</p>;
  }

  const { status, liveTrip, vehicles } = routeData;

  if (!liveTrip) {
    return <p className="text-sm text-gray-600">Ingen linjedata: {status}</p>;
  }

  const stops = liveTrip.stops;
  const first = stops[0];
  const last = stops[stops.length - 1];

  return (
    <div className="flex flex-col space-y-3">
      <div className="text-gray-800">
        <p>
          Sträcka: {first?.stopName ?? '?'} → {last?.stopName ?? '?'} ({stops.length} hållplatser)
        </p>
        <p className="text-sm text-gray-500">
          Riktning {liveTrip.direction} mot {liveTrip.stopHeading} · status: {status}
        </p>
        {routeData.focus && (
          <p className="text-sm text-gray-500">
            Fokuserad · avkortad i början: {routeData.focus.truncatedStart ? 'ja' : 'nej'}, i slutet:{' '}
            {routeData.focus.truncatedEnd ? 'ja' : 'nej'} · på väg in: {routeData.focus.approachingAtStart}{' '}
            uppifrån, {routeData.focus.approachingAtEnd} nedifrån
          </p>
        )}
      </div>

      <div>
        <p className="font-medium text-gray-700">Fordon ({vehicles.length})</p>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-600">Inga fordon i trafik just nu.</p>
        ) : (
          <ul className="mt-1 space-y-2">
            {vehicles.map((vehicle) => (
              <li key={vehicle.tripId} className="text-gray-800">
                <p>{describePosition(vehicle, stops)}</p>
                <p className="text-sm text-gray-500">
                  {describeDirection(vehicle, liveTrip)} · tripId {vehicle.tripId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import { LiveTrip, LiveVehicle, RouteData } from '../../../types/backend';

type LiveTrafficGraphProps = {
  routeData: RouteData | null;
}

/**
 * Where the axis sits horizontally. Stop names and their leader dashes fill everything to its left, so the
 * axis sits well right of centre to give the names the room they need and still leave a lane for the
 * downward destination labels.
 */
const AXIS_X_PERCENT = 65;

/**
 * Position of a stop along the axis, 0 at the top and 1 at the bottom. Equal spacing — schematic, not to
 * scale, the way a real transit map is drawn. Swap this one function to go proportional.
 */
function stopY(index: number, stopCount: number): number {
  return index / (stopCount - 1);
}

/**
 * Position of a vehicle along the axis. `segmentFraction` is how far it has come towards its next stop,
 * applied to a segment of uniform screen length — real distance never enters the drawing.
 */
function vehicleY(vehicle: LiveVehicle, stopCount: number): number {
  return (vehicle.segIdx + vehicle.segmentFraction) / (stopCount - 1);
}

/** A vehicle running with the chain heads for its last stop, which is downwards on screen. */
function isDownwards(vehicle: LiveVehicle, liveTrip: LiveTrip): boolean {
  return vehicle.directionId === liveTrip.direction;
}

/**
 * Where the vehicle is headed. The backend reads this from the vehicle's own trip, so a short turn reports
 * where it really terminates rather than the end of the chain. Falls back to the chain's end for the rare
 * trip whose destination could not be resolved at all.
 */
function destinationName(vehicle: LiveVehicle, liveTrip: LiveTrip): string {
  if (vehicle.destination) {
    return vehicle.destination;
  }
  const stops = liveTrip.stops;
  return isDownwards(vehicle, liveTrip) ? stops[stops.length - 1].stopName : stops[0].stopName;
}

export function LiveTrafficGraph({ routeData }: LiveTrafficGraphProps) {
  if (!routeData) {
    return <p className="text-sm text-gray-600">Hämtar trafikdata...</p>;
  }
  if (!routeData.liveTrip) {
    return <p className="text-sm text-gray-600">Ingen linjedata: {routeData.status}</p>;
  }

  const liveTrip = routeData.liveTrip;
  const stops = liveTrip.stops;
  if (stops.length < 2) {
    return <p className="text-sm text-gray-600">Linjen har för få hållplatser för att ritas.</p>;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Inset so the first and last markers are not clipped — they are centred on 0% and 100%. */}
      <div className="absolute inset-x-0 top-5 bottom-5">
        <div
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gray-400"
          style={{ left: `${AXIS_X_PERCENT}%` }}
        />

        {/* Stop names hug the left edge; a leader dash takes whatever space is left over and ends on the
            axis, so names of any length line up without measuring anything. */}
        {stops.map((stop, index) => (
          <div
            key={stop.stopId}
            className="absolute left-0 flex -translate-y-1/2 items-center gap-2"
            style={{
              top: `${stopY(index, stops.length) * 100}%`,
              right: `${100 - AXIS_X_PERCENT}%`,
            }}
          >
            <span className="min-w-0 truncate text-xs text-gray-600">{stop.stopName}</span>
            <span className="h-px min-w-3 flex-1 bg-gray-300" />
            <span className="absolute right-0 top-1/2 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-gray-500" />
          </div>
        ))}

        {routeData.vehicles.map((vehicle) => {
          const down = isDownwards(vehicle, liveTrip);
          return (
            <div
              key={vehicle.tripId}
              className="absolute left-0 right-0 transition-[top] duration-1000 ease-linear"
              style={{ top: `${vehicleY(vehicle, stops.length) * 100}%` }}
            >
              {/* The triangle rides alongside the axis, offset far enough that it reads as a deliberate
                  lane rather than a misalignment — and so an up and a down vehicle at the same point sit
                  clearly side by side. */}
              <span
                className={`absolute -translate-x-1/2 -translate-y-1/2 text-[10px] leading-none text-[#184fc2] ${
                  down ? 'ml-2' : '-ml-2'
                }`}
                style={{ left: `${AXIS_X_PERCENT}%` }}
              >
                {down ? '▼' : '▲'}
              </span>
              <span
                className={`absolute -translate-y-1/2 truncate rounded-full bg-[#184fc2] px-2 py-0.5 text-xs text-white ${
                  down ? 'max-w-[30%]' : 'max-w-[38%]'
                }`}
                style={
                  down
                    ? { left: `calc(${AXIS_X_PERCENT}% + 1.25rem)` }
                    : { right: `calc(${100 - AXIS_X_PERCENT}% + 1.25rem)` }
                }
              >
                {destinationName(vehicle, liveTrip)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

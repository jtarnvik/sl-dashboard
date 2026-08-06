import { useEffect, useMemo, useState } from 'react';

import { LiveStop, LiveTrip, LiveVehicle, RouteData, RouteFocus } from '../../../types/backend';

type LiveTrafficGraphProps = {
  routeData: RouteData | null;
  /** Stops the user has marked as favourites, by parent station id. Rendered emphasised. */
  favouriteStopIds?: ReadonlySet<string>;
  /** The vehicle whose times are shown, by trip id. Null when nothing is selected. */
  selectedTripId: string | null;
  onSelectVehicle: (tripId: string | null) => void;
}

/**
 * Where the axis sits horizontally. Stop names and their leader dashes fill everything to its left, so the
 * axis sits well right of centre to give the names the room they need and still leave a lane for the
 * downward destination labels.
 */
const AXIS_X_PERCENT = 65;

/**
 * Fraction of the axis reserved at a truncated end for the "line continues" marker. The first and last stops
 * are pushed in by this much so the marker has somewhere to sit beyond them.
 */
const TRUNCATION_INSET = 0.07;

/** How often the countdowns are recomputed. They are shown in whole minutes, so a finer tick buys nothing. */
const COUNTDOWN_TICK_MS = 10 * 1000;

/** The fractions of the axis that the first and last stop occupy, leaving room for truncation markers. */
type AxisSpan = {
  top: number;
  bottom: number;
}

function axisSpan(focus: RouteFocus | null): AxisSpan {
  return {
    top: focus?.truncatedStart ? TRUNCATION_INSET : 0,
    bottom: focus?.truncatedEnd ? 1 - TRUNCATION_INSET : 1,
  };
}

/**
 * Position of a stop along the axis, 0 at the top and 1 at the bottom. Equal spacing — schematic, not to
 * scale, the way a real transit map is drawn. Swap this one function to go proportional.
 */
function stopY(index: number, stopCount: number, span: AxisSpan): number {
  return span.top + (index / (stopCount - 1)) * (span.bottom - span.top);
}

/**
 * Position of a vehicle along the axis. `segmentFraction` is how far it has come towards its next stop,
 * applied to a segment of uniform screen length — real distance never enters the drawing.
 */
function vehicleY(vehicle: LiveVehicle, stopCount: number, span: AxisSpan): number {
  const alongChain = (vehicle.segIdx + vehicle.segmentFraction) / (stopCount - 1);
  return span.top + alongChain * (span.bottom - span.top);
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

/**
 * A predicted departure as the minutes left until it. "Nu" once it has arrived rather than a count that
 * goes negative — a vehicle standing at a stop is at it, however its report and the timetable disagree.
 */
function countdownLabel(departureEpochSeconds: number, now: number): string {
  const minutes = Math.round((departureEpochSeconds * 1000 - now) / 60_000);
  return minutes <= 0 ? 'Nu' : `${minutes} min`;
}

/** Shared pill shape. Real vehicles and approaching counts differ only in colour. */
const PILL_CLASS = 'absolute -translate-y-1/2 truncate rounded-full px-2 py-0.5 text-xs';

/** A vehicle at a known position on the drawn chain. */
const PILL_VEHICLE_CLASS = 'bg-[#184fc2] text-white';

/**
 * A count of vehicles beyond the drawn chain. Muted like a disabled control, because unlike a vehicle pill
 * it marks no particular place — it sits at the truncation marker, not at a position on the line. The text
 * stays full-strength blue: white on a 40% background was too washed out to read.
 */
const PILL_APPROACHING_CLASS = 'bg-[#184fc2]/25 text-[#184fc2]';

/** How far a label sits from the axis. Approaching counts stand further out than vehicles at real positions. */
const VEHICLE_LANE_OFFSET_REM = 1.25;
const APPROACHING_LANE_OFFSET_REM = 2.5;

/**
 * Places a label in the lane for its direction — right of the axis for downward, left for upward. The offset
 * is measured from the axis on both sides, so the two lanes sit symmetrically however wide the regions are.
 */
function laneStyle(down: boolean, offsetRem: number) {
  return down
    ? { left: `calc(${AXIS_X_PERCENT}% + ${offsetRem}rem)` }
    : { right: `calc(${100 - AXIS_X_PERCENT}% + ${offsetRem}rem)` };
}

type TruncationMarkerProps = {
  y: number;
  approaching: number;
  /** True at the bottom end, where vehicles enter the window travelling upwards. */
  fromBelow: boolean;
}

/**
 * The "line continues" marker at a cropped end: a vertical ellipsis at the very end of the axis, and — when
 * anything is on its way in — a count in the lane of the direction it will arrive from. Vehicles heading
 * away from the window are not counted, so no marker appears for them.
 * <p>
 * The count stands further out from the axis than a vehicle label: a vehicle about to enter the window is
 * drawn close to this marker, and at the same offset the two would land on top of each other.
 */
function TruncationMarker({ y, approaching, fromBelow }: TruncationMarkerProps) {
  return (
    <div className="absolute left-0 right-0" style={{ top: `${y * 100}%` }}>
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 text-sm leading-none text-gray-400"
        style={{ left: `${AXIS_X_PERCENT}%` }}
      >
        ⋮
      </span>
      {approaching > 0 && (
        <span
          className={`${PILL_CLASS} ${PILL_APPROACHING_CLASS} max-w-[26%]`}
          style={laneStyle(!fromBelow, APPROACHING_LANE_OFFSET_REM)}
        >
          +{approaching} på väg
        </span>
      )}
    </div>
  );
}

/**
 * How far a countdown sits from the axis on the downward side. Matches the 12px the upward side gets from
 * `pr-3`, so the two read as one lane mirrored rather than two different placements.
 */
const COUNTDOWN_LANE_OFFSET_REM = 0.75;

const COUNTDOWN_CLASS = 'shrink-0 text-xs tabular-nums text-[#184fc2]';

type StopRowProps = {
  stop: LiveStop;
  y: number;
  favourite: boolean;
  /** The selected vehicle's countdown to this stop, or null when it never reaches it. */
  countdown: string | null;
  /** Which side of the axis the countdown goes on — the side the selected vehicle is travelling towards. */
  countdownDown: boolean;
}

/**
 * One stop: its name against the left edge, a leader dash filling whatever is left, and a dot on the axis.
 * Names of any length line up without measuring anything.
 * <p>
 * The countdown takes the lane of the selected vehicle's direction, the same convention the destination
 * labels follow. The two sides are built differently because the row itself only spans the left region: an
 * upward countdown is an ordinary flex child and shortens the dash to make room, while a downward one has
 * to be positioned against the axis from outside the row.
 */
function StopRow({ stop, y, favourite, countdown, countdownDown }: StopRowProps) {
  return (
    <>
      <div
        className="absolute left-0 flex -translate-y-1/2 items-center gap-2"
        style={{ top: `${y * 100}%`, right: `${100 - AXIS_X_PERCENT}%` }}
      >
        <span className={`min-w-0 truncate text-xs ${favourite ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
          {stop.stopName}
        </span>
        <span className="h-px min-w-3 flex-1 bg-gray-300" />
        {/* The dot below is absolutely positioned, so it reserves no space in the row and the countdown
            would otherwise run right up to the axis and under it. `pr-3` clears the dot's 4px radius and
            leaves the same 8px gap the row uses between its other parts. */}
        {countdown && !countdownDown && (
          <span className={`${COUNTDOWN_CLASS} pr-3`}>{countdown}</span>
        )}
        <span className="absolute right-0 top-1/2 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-gray-500" />
      </div>
      {countdown && countdownDown && (
        <span
          className={`${COUNTDOWN_CLASS} absolute -translate-y-1/2`}
          style={{ top: `${y * 100}%`, left: `calc(${AXIS_X_PERCENT}% + ${COUNTDOWN_LANE_OFFSET_REM}rem)` }}
        >
          {countdown}
        </span>
      )}
    </>
  );
}

type VehicleMarkerProps = {
  vehicle: LiveVehicle;
  liveTrip: LiveTrip;
  y: number;
  selected: boolean;
  /** True when some other vehicle is selected — this one steps back rather than disappearing. */
  dimmed: boolean;
  onSelect: () => void;
}

/**
 * A vehicle: a triangle riding alongside the axis, and a destination label in its direction's lane.
 * <p>
 * Both are click targets. The triangle carries generous padding, because a 10px glyph is far too small to
 * hit on a phone — and the padding must stay symmetric: the button is centred on the vehicle's position by
 * `-translate-y-1/2`, which halves the *padded* box, so anything that shifts the box off the glyph's centre
 * takes the triangle off the position it is meant to mark.
 * <p>
 * A dimmed vehicle keeps its triangle but loses its label. That is not only decluttering: the upward lane
 * sits exactly where the leader dashes are, so leaving the labels up would put them on top of the very
 * countdowns the selection exists to show.
 */
function VehicleMarker({ vehicle, liveTrip, y, selected, dimmed, onSelect }: VehicleMarkerProps) {
  const down = isDownwards(vehicle, liveTrip);
  const destination = destinationName(vehicle, liveTrip);

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    onSelect();
  }

  return (
    <div
      className={`absolute left-0 right-0 transition-[top] duration-1000 ease-linear ${dimmed ? 'opacity-30' : ''}`}
      style={{ top: `${y * 100}%` }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Visa tider för avgången mot ${destination}`}
        aria-pressed={selected}
        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-2 leading-none text-[#184fc2] ${
          down ? 'ml-2' : '-ml-2'
        } ${selected ? 'text-sm' : 'text-[10px]'}`}
        style={{ left: `${AXIS_X_PERCENT}%` }}
      >
        {down ? '▼' : '▲'}
      </button>
      {!dimmed && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={`Visa tider för avgången mot ${destination}`}
          aria-pressed={selected}
          className={`${PILL_CLASS} ${PILL_VEHICLE_CLASS} cursor-pointer ${down ? 'max-w-[30%]' : 'max-w-[38%]'} ${
            selected ? 'ring-2 ring-[#184fc2]/40' : ''
          }`}
          style={laneStyle(down, VEHICLE_LANE_OFFSET_REM)}
        >
          {destination}
        </button>
      )}
    </div>
  );
}

type SchematicProps = {
  liveTrip: LiveTrip;
  vehicles: LiveVehicle[];
  focus: RouteFocus | null;
  favouriteStopIds?: ReadonlySet<string>;
  selectedTripId: string | null;
  onSelectVehicle: (tripId: string | null) => void;
}

/**
 * The drawing itself, split from {@link LiveTrafficGraph} so the guards there can return before any hook
 * runs. Everything below this point can assume a chain of at least two stops.
 */
function Schematic({ liveTrip, vehicles, focus, favouriteStopIds, selectedTripId, onSelectVehicle }: SchematicProps) {
  const stops = liveTrip.stops;
  const span = axisSpan(focus);

  /**
   * Derived rather than kept in state, so a vehicle missing from one poll simply shows no times and comes
   * back on the next. Clearing the selection here instead would fight the poll loop.
   */
  const selectedVehicle = vehicles.find(vehicle => vehicle.tripId === selectedTripId) ?? null;
  const countdownDown = selectedVehicle !== null && isDownwards(selectedVehicle, liveTrip);

  const countdownsByStopId = useMemo(() => {
    const map = new Map<string, number>();
    for (const prediction of selectedVehicle?.stopPredictions ?? []) {
      map.set(prediction.stopId, prediction.departure);
    }
    return map;
  }, [selectedVehicle]);

  /**
   * The clock the countdowns are measured against. Ticks unconditionally rather than only while something
   * is selected: gating it would mean seeding a fresh value the moment a selection starts, which is a
   * setState inside an effect, and the saving is nothing next to the poll that re-renders this every eight
   * seconds anyway.
   */
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden" onClick={() => onSelectVehicle(null)}>
      {/* Inset so the first and last markers are not clipped — they are centred on 0% and 100%. */}
      <div className="absolute inset-x-0 top-5 bottom-5">
        <div
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gray-400"
          style={{ left: `${AXIS_X_PERCENT}%` }}
        />

        {stops.map((stop, index) => {
          const departure = countdownsByStopId.get(stop.stopId);
          return (
            <StopRow
              key={stop.stopId}
              stop={stop}
              y={stopY(index, stops.length, span)}
              favourite={favouriteStopIds?.has(stop.stopId) ?? false}
              countdown={departure === undefined ? null : countdownLabel(departure, now)}
              countdownDown={countdownDown}
            />
          );
        })}

        {/* Centred on the very ends of the axis, so the marker reads as the line running off the view. The
            inset that pushes the first and last stop in is what keeps them clear of it. */}
        {focus?.truncatedStart && (
          <TruncationMarker y={0} approaching={focus.approachingAtStart} fromBelow={false} />
        )}
        {focus?.truncatedEnd && (
          <TruncationMarker y={1} approaching={focus.approachingAtEnd} fromBelow={true} />
        )}

        {vehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.tripId}
            vehicle={vehicle}
            liveTrip={liveTrip}
            y={vehicleY(vehicle, stops.length, span)}
            selected={vehicle.tripId === selectedTripId}
            dimmed={selectedTripId !== null && vehicle.tripId !== selectedTripId}
            onSelect={() => onSelectVehicle(vehicle.tripId === selectedTripId ? null : vehicle.tripId)}
          />
        ))}
      </div>
    </div>
  );
}

export function LiveTrafficGraph({ routeData, favouriteStopIds, selectedTripId, onSelectVehicle }: LiveTrafficGraphProps) {
  if (!routeData) {
    return <p className="text-sm text-gray-600">Hämtar trafikdata...</p>;
  }
  if (!routeData.liveTrip) {
    return <p className="text-sm text-gray-600">Ingen linjedata: {routeData.status}</p>;
  }
  if (routeData.liveTrip.stops.length < 2) {
    return <p className="text-sm text-gray-600">Linjen har för få hållplatser för att ritas.</p>;
  }

  return (
    <Schematic
      liveTrip={routeData.liveTrip}
      vehicles={routeData.vehicles}
      focus={routeData.focus}
      favouriteStopIds={favouriteStopIds}
      selectedTripId={selectedTripId}
      onSelectVehicle={onSelectVehicle}
    />
  );
}

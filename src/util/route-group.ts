import { MonitoredRouteGroup } from '../types/backend';

/**
 * The route group a line belongs to, or null when the line is not one the backend tracks.
 *
 * Only the monitored lines have cached GTFS data, so this is what decides whether a departure can offer a
 * way into the live traffic view at all.
 */
export function findRouteGroupForLine(groups: MonitoredRouteGroup[], transportMode: string,
                                      designation: string): MonitoredRouteGroup | null {
  const base = baseLineName(designation);
  return groups.find(
    group => group.transportMode === transportMode && (group.lines ?? []).includes(base)) ?? null;
}

/**
 * A line designation without its variant suffix — "43X" is the same line as "43".
 *
 * This mirrors `GtfsNameUtil.matchesMonitoredRouteName` on the backend, which allows a single optional
 * trailing letter. The two rules have to agree: a designation this strips differently from the backend
 * would offer the user a group whose data does not in fact contain that vehicle.
 */
function baseLineName(designation: string): string {
  return designation.replace(/[A-Za-z]$/, '');
}

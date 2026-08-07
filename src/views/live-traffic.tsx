import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Switch } from '@headlessui/react';
import { MdClose, MdExpandMore, MdWarningAmber } from 'react-icons/md';

import { fetchGtfsDataStatus, fetchRouteData, fetchRouteGroups, saveFavouriteStops, saveLiveTrafficView } from '../communication/backend';
import { MAX_FAVOURITE_STOPS } from '../communication/constant';
import { ErrorHandler } from '../components/error-handler';
import { SLButton } from '../components/common/sl-button';
import { View } from '../components/common/view';
import { TransportationIconCommon } from '../components/common/line';
import { LiveTrafficGraph } from '../components/pane/live-traffic-graph';
import ErrorContext from '../contexts/error-context';
import PageTitleContext from '../contexts/page-title-context';
import { useUser, useUserLoginState, UserLoginState } from '../hook/use-user';
import { useVisibility } from '../hook/use-visibility';
import { toTransportationMode } from '../util/transport-mode';
// The type shares its name with the component exported below, hence the alias — same convention the
// `Deviation` collision uses elsewhere.
import { GtfsDataStatus, LiveStop, LiveTrafficView as LiveTrafficViewSetting, MonitoredRouteGroup, RouteData, UserSettings } from '../types/backend';

// The line to fall back on when nothing was remembered — or when what was remembered no longer exists.
// Without this the first group alphabetically wins, which is bus 112, a line kept only to exercise the
// route presentation logic.
const DEFAULT_GROUP_DISPLAY_NAME = '117';

// Vehicles move, so a snapshot goes stale fast. The backend refreshes its own cache every 5s, so polling
// much faster than this would only re-read the same values.
const ROUTE_DATA_POLL_MS = 8 * 1000;

// Query params that preselect a line, used when arriving from a departure row. Read once on mount and then
// cleared, so they cannot override a selection the user makes afterwards.
const PARAM_TRANSPORT_MODE = 'mode';
const PARAM_ROUTE_GROUP = 'group';
// The vehicle the departure row resolved to, and — when it resolved to none — why not. Never both.
const PARAM_TRIP = 'trip';
const PARAM_RESOLVE = 'resolve';

/**
 * What to say when a departure row could not be tied to a vehicle. Never an error banner: the line is shown
 * regardless, so this is a note about a missing bonus rather than a failure.
 *
 * `NO_MATCH` is the everyday one. SL puts a journey on its board as soon as it is running, but the realtime
 * feed only carries vehicles that are actually reporting positions, and the two do not switch over at the
 * same instant.
 */
const RESOLVE_MESSAGES: Record<string, string> = {
  NO_MATCH: 'Kunde inte hitta fordonet i livetrafiken — visar hela linjen.',
  AMBIGUOUS: 'Flera fordon matchade avgången — visar hela linjen.',
  NO_LIVE_DATA: 'Livetrafiken är inte tillgänglig just nu — visar hela linjen.',
};

function groupKey(group: MonitoredRouteGroup): string {
  return `${group.transportMode}:${group.routeGroup}`;
}

/** Identifies what a route data response was asked for, so a late reply for an old selection can be ignored. */
function requestKey(group: MonitoredRouteGroup, focused: boolean): string {
  return `${groupKey(group)}:${focused}`;
}

/**
 * A response together with the selection it answers. Switching line while a request is in flight would
 * otherwise show the old line's vehicles on the new line's chain — and the late reply could land last and
 * win. Keeping the key with the data lets the render simply ignore anything that no longer matches.
 */
type FetchedRouteData = {
  key: string;
  data: RouteData | null;
}

/** A group can only be focused if a window was configured for it. Buses have none. */
function hasFocusWindow(group: MonitoredRouteGroup): boolean {
  return group.focusStart !== null && group.focusEnd !== null;
}

/**
 * Whether the focus switch can be operated at all. It is locked in two opposite situations: `onlyFocused`
 * groups (the metro) must stay focused because the unfocused view would have to draw a fork it cannot
 * render, and groups without a window (the buses) have nothing to focus.
 */
function isFocusLocked(group: MonitoredRouteGroup): boolean {
  return group.onlyFocused || !hasFocusWindow(group);
}

/**
 * Focused is the default wherever it is possible — for the train it is what you almost always want, and for
 * the metro it is the only allowed view. A group with no window is the exception: there is nothing to focus,
 * so the flag stays off and says so honestly to the backend.
 */
function defaultFocused(group: MonitoredRouteGroup): boolean {
  return hasFocusWindow(group);
}

/**
 * The focus flag to show for a group. A locked group always gets its forced value — the remembered flag is
 * about what the user chose, and for a group whose switch does nothing there was no choice to make. Null
 * remembered means the switch has never been operated, so the group's own default stands.
 */
function resolveFocused(group: MonitoredRouteGroup, rememberedFocus: boolean | null): boolean {
  if (isFocusLocked(group)) {
    return defaultFocused(group);
  }
  return rememberedFocus ?? defaultFocused(group);
}

function pickDefaultGroup(groups: MonitoredRouteGroup[]): MonitoredRouteGroup | null {
  if (groups.length === 0) {
    return null;
  }
  return groups.find((group) => group.displayName === DEFAULT_GROUP_DISPLAY_NAME) ?? groups[0];
}

/**
 * The remembered group, if it is still one the backend serves. A line dropped from `gtfs_monitored_route`,
 * or a whole dataset that failed to parse, leaves a stored value matching nothing — in which case the
 * caller falls back to the default rather than showing an empty schematic.
 */
function findStoredGroup(groups: MonitoredRouteGroup[], stored: LiveTrafficViewSetting | null): MonitoredRouteGroup | null {
  if (!stored) {
    return null;
  }
  return groups.find(
    (group) => group.transportMode === stored.transportMode && group.routeGroup === stored.routeGroup) ?? null;
}

/**
 * Persists the selection, and mirrors it into the user context so that leaving the view and coming back
 * restores it without waiting for the next `/api/auth/me`.
 *
 * The two differ in one place on purpose. A locked group sends `focused: null` so the backend leaves the
 * remembered flag alone, while the context keeps the flag it already had — the same rule on both sides, so
 * selecting the metro cannot quietly turn the train's focus back on.
 *
 * Module level, and handed everything it needs, so that the mount effect can call it without dragging
 * `rememberedFocus` into its dependencies and re-running the whole group fetch.
 */
function persistView(group: MonitoredRouteGroup, focusedValue: boolean, rememberedFocus: boolean | null,
                     updateSettings: (patch: Partial<UserSettings>) => void) {
  const locked = isFocusLocked(group);
  saveLiveTrafficView({
    transportMode: group.transportMode,
    routeGroup: group.routeGroup,
    focused: locked ? null : focusedValue,
  });
  updateSettings({
    liveTrafficView: {
      transportMode: group.transportMode,
      routeGroup: group.routeGroup,
      focused: locked ? rememberedFocus : focusedValue,
    },
  });
}

/**
 * The group named in the url, when the view was reached from a departure row rather than from the menu.
 * Takes precedence over what was remembered — arriving by way of a specific line is a clearer statement of
 * intent than a setting saved on some earlier visit.
 */
function findGroupFromParams(groups: MonitoredRouteGroup[], params: URLSearchParams): MonitoredRouteGroup | null {
  const mode = params.get(PARAM_TRANSPORT_MODE);
  const group = params.get(PARAM_ROUTE_GROUP);
  if (!mode || !group) {
    return null;
  }
  return groups.find((g) => g.transportMode === mode && String(g.routeGroup) === group) ?? null;
}

type RouteGroupListboxProps = {
  groups: MonitoredRouteGroup[];
  selectedGroup: MonitoredRouteGroup | null;
  onChange: (group: MonitoredRouteGroup) => void;
}

function RouteGroupListbox({ groups, selectedGroup, onChange }: RouteGroupListboxProps) {
  return (
    <Listbox value={selectedGroup ?? undefined} onChange={onChange}>
      <ListboxButton className="flex items-center justify-between gap-2 border border-gray-300 rounded px-2 py-1 bg-white text-gray-800 min-w-36 cursor-pointer">
        <span className="flex items-center gap-2">
          {selectedGroup && (
            <TransportationIconCommon
              mode={toTransportationMode(selectedGroup.transportMode)}
              className="size-5 shrink-0"
            />
          )}
          {selectedGroup?.displayName ?? ''}
        </span>
        <MdExpandMore className="text-gray-500 shrink-0" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="border border-gray-200 bg-white shadow-md rounded-sm z-30 mt-1 min-w-(--button-width)"
      >
        {groups.map(g => (
          <ListboxOption
            key={groupKey(g)}
            value={g}
            className="flex items-center gap-2 cursor-pointer px-3 py-1 data-focus:bg-[#184fc2] data-focus:text-white data-selected:font-medium"
          >
            <TransportationIconCommon
              mode={toTransportationMode(g.transportMode)}
              className="size-5 shrink-0"
            />
            {g.displayName}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

export function LiveTrafficView() {
  const loginState = useUserLoginState();
  const { user, updateSettings } = useUser();
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [groups, setGroups] = useState<MonitoredRouteGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<MonitoredRouteGroup | null>(null);
  const [focused, setFocused] = useState(false);
  const [rememberedFocus, setRememberedFocus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [gtfsStatus, setGtfsStatus] = useState<GtfsDataStatus | null>(null);
  const [fetchedRouteData, setFetchedRouteData] = useState<FetchedRouteData | null>(null);

  /**
   * The vehicle whose stop times are shown. Held here rather than in the schematic so that it survives the
   * poll replacing `routeData` every eight seconds.
   */
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  /**
   * Why the departure row that led here could not be tied to a vehicle, when it could not. Comes from the
   * url, so it survives until the user dismisses it or changes the selection — unlike the "outside the
   * window" note below, which is derived from the poll and comes and goes with the data.
   */
  const [resolveOutcome, setResolveOutcome] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  /**
   * Why the last tap on a stop name did not mark it — only ever the cap today. Refused here rather than left
   * to the backend, which truncates silently and would leave the eleventh stop bold until the next reload.
   */
  const [favouriteNotice, setFavouriteNotice] = useState<string | null>(null);

  /**
   * The query string as it was on arrival. A ref for the same reason `storedViewRef` is one: the params are
   * cleared once they have been applied, and reading them from state would re-run the effect below.
   */
  const [searchParams] = useSearchParams();
  const initialParamsRef = useRef(searchParams);

  /**
   * The remembered view, held in a ref rather than read from `user` in the effect below. Saving patches
   * the user context, so a dependency on it would re-run that effect, refetch the route groups and reset
   * the selection — which would then save again. The ref is read only after login has resolved, by which
   * point the settings have arrived.
   */
  const storedViewRef = useRef<LiveTrafficViewSetting | null>(null);

  useEffect(() => {
    storedViewRef.current = user?.settings?.liveTrafficView ?? null;
  }, [user]);

  /**
   * Held in a ref for the same reason. `updateSettings` is a plain function in `App`, so it is a new value
   * on every render there — as a dependency of the mount effect it would refetch the route groups
   * constantly.
   */
  const updateSettingsRef = useRef(updateSettings);

  useEffect(() => {
    updateSettingsRef.current = updateSettings;
  }, [updateSettings]);

  const favouriteStopIds = useMemo(
    () => new Set((user?.settings?.favouriteStops ?? []).map(favourite => favourite.stopId)),
    [user?.settings?.favouriteStops]);

  const focusDisabled = selectedGroup ? isFocusLocked(selectedGroup) : true;
  const focusLabelClass = `font-medium select-none ${focusDisabled ? 'text-gray-400' : 'text-gray-700'}`;

  // Only show data that answers the current selection; anything else is a leftover from a previous one.
  const currentKey = selectedGroup ? requestKey(selectedGroup, focused) : null;
  const routeData = fetchedRouteData?.key === currentKey ? fetchedRouteData.data : null;

  /**
   * The selected vehicle was matched against the group's full chain but is not among the ones drawn, which
   * on a focused view means it is still out beyond the window — a train 20 minutes away at Bålsta while the
   * window starts at Kungsängen is the everyday case.
   *
   * Requiring an actually truncated chain is what keeps this from firing on the ordinary gap where a vehicle
   * misses one poll and returns on the next. Derived rather than stored, so it clears itself the moment the
   * vehicle appears.
   */
  const selectedVehicleDrawn = routeData?.vehicles.some(vehicle => vehicle.tripId === selectedTripId) ?? false;
  const vehicleOutsideWindow = selectedTripId !== null && routeData !== null && !selectedVehicleDrawn
    && (routeData.focus?.truncatedStart === true || routeData.focus?.truncatedEnd === true);

  // The favourite note comes first: it describes what the user did a moment ago, while the other two
  // describe the departure row that led here.
  const notice = noticeDismissed
    ? null
    : favouriteNotice
      ?? (vehicleOutsideWindow
        ? 'Fordonet är ännu utanför det visade avsnittet.'
        : (resolveOutcome ? RESOLVE_MESSAGES[resolveOutcome] ?? null : null));
  // Only offered when the note actually is the outside-the-window one — the favourite note takes the bar
  // over, and a "show the whole line" link under it would answer a question nobody asked.
  const canWiden = favouriteNotice === null && vehicleOutsideWindow && selectedGroup !== null
    && !isFocusLocked(selectedGroup);

  useEffect(() => {
    setHeading('Aktuell trafik');
  }, [setHeading]);

  useEffect(() => {
    if (loginState === UserLoginState.Loading) {
      return;
    }
    if (loginState !== UserLoginState.LoggedIn) {
      navigate('/');
      return;
    }
    // This effect re-runs more often than "on mount": `setError` is a plain function in `App`, so it is a
    // new value on every render there. Without this guard a reply belonging to a run that is already over
    // still acts on it — and the `navigate` below would then fire from a view the user has already left,
    // dragging them back to /live-traffic from wherever they went.
    let cancelled = false;
    Promise.all([fetchRouteGroups(setError), fetchGtfsDataStatus(setError)]).then(([groups, status]) => {
      if (cancelled) {
        return;
      }
      setGtfsStatus(status);
      if (status?.staticDataAvailable !== false) {
        setGroups(groups);
        const stored = storedViewRef.current;
        const params = initialParamsRef.current;
        const fromUrl = findGroupFromParams(groups, params);
        const initialGroup = fromUrl ?? findStoredGroup(groups, stored) ?? pickDefaultGroup(groups);
        if (initialGroup) {
          setSelectedGroup(initialGroup);
          setRememberedFocus(stored?.focused ?? null);
          setFocused(resolveFocused(initialGroup, stored?.focused ?? null));
        }
        if (fromUrl) {
          // Arriving by link is as much a choice as picking from the listbox, so it is remembered the same
          // way — and the params go, so a later selection is not undone by a reload.
          persistView(fromUrl, resolveFocused(fromUrl, stored?.focused ?? null), stored?.focused ?? null,
            updateSettingsRef.current);
          setSelectedTripId(params.get(PARAM_TRIP));
          setResolveOutcome(params.get(PARAM_RESOLVE));
          // Emptied as well as cleared from the url, because the ref outlives the run that consumed it. A
          // later re-run would otherwise re-apply the arrival — reselecting that vehicle over whatever the
          // user had picked since, and navigating on top of it.
          initialParamsRef.current = new URLSearchParams();
          navigate('/live-traffic', { replace: true });
        }
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loginState, navigate, setError]);

  const updateRouteData = useCallback(() => {
    if (!selectedGroup) {
      return;
    }
    const key = requestKey(selectedGroup, focused);
    fetchRouteData(selectedGroup.transportMode, selectedGroup.routeGroup, focused, setError)
      .then((data) => setFetchedRouteData({ key, data }));
  }, [selectedGroup, focused, setError]);

  useVisibility({ onVisible: updateRouteData });

  useEffect(() => {
    updateRouteData();
    const intervalId = setInterval(() => {
      // Polling also holds the backend's sliding poll window open, so stopping while the tab is hidden lets
      // the upstream loop wind down on its own.
      if (document.visibilityState === 'visible') {
        updateRouteData();
      }
    }, ROUTE_DATA_POLL_MS);
    return () => clearInterval(intervalId);
  }, [updateRouteData]);

  // A selected vehicle belongs to the chain it was picked on, so both of these drop it. Done here in the
  // handlers rather than in an effect watching the data, which would fight the poll loop. The notice goes
  // with it: it described a departure row that is no longer what is being looked at.
  function handleListboxChange(group: MonitoredRouteGroup) {
    const nextFocused = resolveFocused(group, rememberedFocus);
    setSelectedGroup(group);
    setFocused(nextFocused);
    setSelectedTripId(null);
    clearNotice();
    persistView(group, nextFocused, rememberedFocus, updateSettings);
  }

  /** Only reachable when the switch is operable, so this is always a real choice worth remembering. */
  function handleFocusChange(nextFocused: boolean) {
    setFocused(nextFocused);
    setRememberedFocus(nextFocused);
    setSelectedTripId(null);
    clearNotice();
    if (selectedGroup) {
      persistView(selectedGroup, nextFocused, nextFocused, updateSettings);
    }
  }

  /**
   * Widens the view to the whole line, keeping the selected vehicle. Deliberately not `handleFocusChange`,
   * which drops the selection — here the selection is the entire reason for widening, since the vehicle is
   * out beyond the window and this is what brings it into view.
   */
  function handleShowWholeLine() {
    setFocused(false);
    setRememberedFocus(false);
    if (selectedGroup) {
      persistView(selectedGroup, false, false, updateSettings);
    }
  }

  /**
   * Marks or unmarks the tapped stop. The context is patched first so the name goes bold under the finger;
   * waiting on the round trip would feel broken next to a view that otherwise only moves every eight
   * seconds. A rejected save puts it back and says so — unlike the remembered group and focus, this is a
   * change the user will come looking for later, so it must not fail quietly.
   */
  function handleToggleFavourite(stop: LiveStop) {
    const current = user?.settings?.favouriteStops ?? [];
    const isFavourite = current.some(favourite => favourite.stopId === stop.stopId);
    if (!isFavourite && current.length >= MAX_FAVOURITE_STOPS) {
      setFavouriteNotice(`Du kan ha högst ${MAX_FAVOURITE_STOPS} favorithållplatser — ta bort någon först.`);
      setNoticeDismissed(false);
      return;
    }

    const next = isFavourite
      ? current.filter(favourite => favourite.stopId !== stop.stopId)
      : [...current, { stopId: stop.stopId, stopName: stop.stopName }];
    setFavouriteNotice(null);
    updateSettings({ favouriteStops: next });
    saveFavouriteStops(next, setError).then(saved => {
      if (!saved) {
        updateSettings({ favouriteStops: current });
      }
    });
  }

  function clearNotice() {
    setResolveOutcome(null);
    setFavouriteNotice(null);
    setNoticeDismissed(false);
  }

  return (
    <View className="h-[calc(100dvh-3.5rem)] pb-1">
      <ErrorHandler />
      {loading ? (
        <p className="text-gray-600">Laddar...</p>
      ) : gtfsStatus?.staticDataAvailable === false ? (
        <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4 flex-1 overflow-hidden">
          <p className="text-gray-800">Trafikdata är inte tillgänglig idag och aktuell trafik kan inte visas.</p>
          <p className="text-sm text-gray-500 mt-2">Försök igen imorgon eller kontakta administratören.</p>
        </div>
      ) : (
        <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col space-y-3 min-h-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">Linje</span>
              <RouteGroupListbox groups={groups} selectedGroup={selectedGroup} onChange={handleListboxChange} />
              <Switch
                checked={focused}
                onChange={handleFocusChange}
                disabled={focusDisabled}
                className="ml-4 group relative inline-flex h-5 w-9 cursor-pointer rounded-full bg-gray-300 p-0.5 transition-colors data-checked:bg-[#184fc2] data-disabled:cursor-not-allowed data-disabled:opacity-50"
              >
                <span className="size-4 rounded-full bg-white shadow-sm transition-transform translate-x-0 group-data-checked:translate-x-4" />
              </Switch>
              <span className={focusLabelClass}>Fokus</span>
            </div>
            {notice && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2 text-sm text-gray-700">
                <MdWarningAmber className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="flex-1">
                  {notice}
                  {canWiden && (
                    <>
                      {' '}
                      <button
                        onClick={handleShowWholeLine}
                        className="text-[#184fc2] hover:text-[#578ff3] underline cursor-pointer"
                      >
                        Visa hela linjen
                      </button>
                    </>
                  )}
                </span>
                <button onClick={() => setNoticeDismissed(true)} aria-label="Stäng" className="cursor-pointer">
                  <MdClose className="size-4 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <LiveTrafficGraph
                routeData={routeData}
                favouriteStopIds={favouriteStopIds}
                onToggleFavourite={handleToggleFavourite}
                selectedTripId={selectedTripId}
                onSelectVehicle={setSelectedTripId}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
      </div>
    </View>
  );
}

import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Switch } from '@headlessui/react';
import { MdExpandMore } from 'react-icons/md';

import { fetchGtfsDataStatus, fetchRouteData, fetchRouteGroups } from '../communication/backend';
import { ErrorHandler } from '../components/error-handler';
import { SLButton } from '../components/common/sl-button';
import { View } from '../components/common/view';
import { TransportationIconCommon, TransportationMode } from '../components/common/line';
import { ModalDialog } from '../components/common/modal-dialog';
import { LiveTrafficOverview } from '../components/pane/live-traffic-overview';
import ErrorContext from '../contexts/error-context';
import PageTitleContext from '../contexts/page-title-context';
import { useUserLoginState, UserLoginState } from '../hook/use-user';
import { useVisibility } from '../hook/use-visibility';
import { GtfsDataStatus, MonitoredRouteGroup, RouteData } from '../types/backend';

// The line to preselect. Without this the first group alphabetically wins, which is bus 112 — a line kept
// only to exercise the route presentation logic.
const DEFAULT_GROUP_DISPLAY_NAME = '117';

// Vehicles move, so a snapshot goes stale fast. The backend refreshes its own cache every 5s, so polling
// much faster than this would only re-read the same values.
const ROUTE_DATA_POLL_MS = 8 * 1000;

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

function pickDefaultGroup(groups: MonitoredRouteGroup[]): MonitoredRouteGroup | null {
  if (groups.length === 0) {
    return null;
  }
  return groups.find((group) => group.displayName === DEFAULT_GROUP_DISPLAY_NAME) ?? groups[0];
}

function toTransportationMode(transportMode: string): TransportationMode {
  switch (transportMode) {
    case 'TRAIN': return TransportationMode.TRAIN;
    case 'BUS':   return TransportationMode.BUS;
    case 'METRO': return TransportationMode.SUBWAY;
    case 'TRAM':  return TransportationMode.TRAM;
    default:      return TransportationMode.UNKNOWN;
  }
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
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [groups, setGroups] = useState<MonitoredRouteGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<MonitoredRouteGroup | null>(null);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gtfsStatus, setGtfsStatus] = useState<GtfsDataStatus | null>(null);
  const [fetchedRouteData, setFetchedRouteData] = useState<FetchedRouteData | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);

  const focusDisabled = selectedGroup?.onlyFocused ?? false;
  const focusLabelClass = `font-medium select-none ${focusDisabled ? 'text-gray-400' : 'text-gray-700'}`;

  // Only show data that answers the current selection; anything else is a leftover from a previous one.
  const currentKey = selectedGroup ? requestKey(selectedGroup, focused) : null;
  const routeData = fetchedRouteData?.key === currentKey ? fetchedRouteData.data : null;

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
    Promise.all([fetchRouteGroups(setError), fetchGtfsDataStatus(setError)]).then(([groups, status]) => {
      setGtfsStatus(status);
      if (status?.staticDataAvailable !== false) {
        setGroups(groups);
        const defaultGroup = pickDefaultGroup(groups);
        if (defaultGroup) {
          setSelectedGroup(defaultGroup);
          setFocused(defaultGroup.onlyFocused);
        }
      }
      setLoading(false);
    });
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

  function handleListboxChange(group: MonitoredRouteGroup) {
    setSelectedGroup(group);
    setFocused(group.onlyFocused);
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
                onChange={setFocused}
                disabled={focusDisabled}
                className="ml-4 group relative inline-flex h-5 w-9 cursor-pointer rounded-full bg-gray-300 p-0.5 transition-colors data-checked:bg-[#184fc2] data-disabled:cursor-not-allowed data-disabled:opacity-50"
              >
                <span className="size-4 rounded-full bg-white shadow-sm transition-transform translate-x-0 group-data-checked:translate-x-4" />
              </Switch>
              <span className={focusLabelClass}>Fokus</span>
              {/* TODO: temporary — remove once the graphical view replaces the text representation. */}
              <SLButton onClick={() => setOverviewOpen(true)} thin>Text</SLButton>
            </div>
            {/* TODO: temporary — placeholder marking the area the graphical live view will occupy. */}
            <div className="flex-1 min-h-0 bg-red-500/20 border-2 border-red-500 rounded flex items-center justify-center">
              <span className="text-sm text-red-700">Graphical-Live-Trip</span>
            </div>
          </div>
        </div>
      )}

      {/* TODO: temporary — the text representation lives here until the graphical view can replace it. It
          reads the same routeData as the view, so it keeps updating while polling continues. */}
      <ModalDialog
        isOpen={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        title="Aktuell trafik som text"
        scrollable
      >
        <LiveTrafficOverview routeData={routeData} />
      </ModalDialog>
      <div className="flex justify-end">
        <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
      </div>
    </View>
  );
}

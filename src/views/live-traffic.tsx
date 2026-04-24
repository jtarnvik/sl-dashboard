import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Switch } from '@headlessui/react';
import { MdExpandMore } from 'react-icons/md';

import { fetchRouteGroups } from '../communication/backend';
import { ErrorHandler } from '../components/error-handler';
import { SLButton } from '../components/common/sl-button';
import { View } from '../components/common/view';
import { TransportationIconCommon, TransportationMode } from '../components/common/line';
import ErrorContext from '../contexts/error-context';
import PageTitleContext from '../contexts/page-title-context';
import { useUserLoginState, UserLoginState } from '../hook/use-user';
import { MonitoredRouteGroup } from '../types/backend';

function groupKey(group: MonitoredRouteGroup): string {
  return `${group.transportMode}:${group.routeGroup}`;
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

  const focusDisabled = selectedGroup?.onlyFocused ?? false;
  const focusLabelClass = `font-medium select-none ${focusDisabled ? 'text-gray-400' : 'text-gray-700'}`;

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
    fetchRouteGroups(setError).then(data => {
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0]);
        setFocused(data[0].onlyFocused);
      }
      setLoading(false);
    });
  }, [loginState, navigate, setError]);

  function handleListboxChange(group: MonitoredRouteGroup) {
    setSelectedGroup(group);
    setFocused(group.onlyFocused);
  }

  return (
    <View className="h-[calc(100dvh-3.5rem)] pb-1">
      <ErrorHandler />
      {loading ? (
        <p className="text-gray-600">Laddar...</p>
      ) : (
        <div className="bg-[#F1F2F3] border border-gray-200 rounded-lg shadow p-4 flex-1 overflow-hidden">
          <div className="flex flex-col space-y-3">

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
            </div>

            {selectedGroup && (
              <p className="text-sm text-gray-500">
                Vald grupp: {selectedGroup.displayName} (transportMode: {selectedGroup.transportMode},
                routeGroup: {selectedGroup.routeGroup}), Fokuserad: {focused ? 'ja' : 'nej'}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <SLButton onClick={() => navigate('/')} thin>Tillbaka till startsidan</SLButton>
      </div>
    </View>
  );
}

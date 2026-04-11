import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { IoCloseCircle } from "react-icons/io5";

import { URL_GET_STOP_POINT } from "../../../communication/constant.ts";
import { addRecentStop, clearRecentStops } from "../../../communication/backend.ts";
import { StopFinderLocation, StopFinderResponse } from "../../../types/sl-journeyplaner-responses.ts";
import { RecentStop } from "../../../types/backend.ts";
import ErrorContext from "../../../contexts/error-context.ts";
import { useUser, useUserLoginState, UserLoginState } from "../../../hook/use-user.ts";

type Props = {
  initialQuery?: string;
  onSelect: (location: StopFinderLocation) => void;
  onClear?: () => void;
  compact?: boolean;
}

export function StopAutocomplete({ initialQuery = '', onSelect, onClear, compact = false }: Props) {
  const { setError } = useContext(ErrorContext);
  const { user } = useUser();
  const loginState = useUserLoginState();
  const isLoggedIn = loginState === UserLoginState.LoggedIn;

  const [query, setQuery] = useState(initialQuery);
  const [stopResults, setStopResults] = useState<StopFinderLocation[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopFinderLocation | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [recentStops, setRecentStops] = useState<RecentStop[]>(() => user?.settings?.recentStops ?? []);

  const searchAbortRef = useRef<AbortController | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      searchAbortRef.current?.abort();
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedStop(null);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setStopResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      try {
        const response = await axios.get<StopFinderResponse>(URL_GET_STOP_POINT(value.trim()), {
          signal: controller.signal
        });
        setStopResults((response.data.locations ?? []).slice(0, 5));
      } catch {
        // abort and network errors are ignored silently
      }
    }, 300);
  }

  function recordRecentStop(stopPointId: string, stopPointName: string, stopPointParentName?: string) {
    if (!isLoggedIn) {
      return;
    }
    const updated = [
      { stopPointId, stopPointName, stopPointParentName },
      ...recentStops.filter(s => s.stopPointId !== stopPointId)
    ].slice(0, 5);
    setRecentStops(updated);
    addRecentStop({ stopPointId, stopPointName, stopPointParentName }, setError);
  }

  function handleStopSelect(location: StopFinderLocation) {
    setSelectedStop(location);
    setQuery(location.disassembledName ?? location.name);
    setStopResults([]);
    recordRecentStop(location.id, location.disassembledName ?? location.name, location.parent?.name);
    onSelect(location);
  }

  function handleRecentStopSelect(stop: RecentStop) {
    const synthetic: StopFinderLocation = {
      id: stop.stopPointId,
      name: stop.stopPointName,
      disassembledName: stop.stopPointName,
      coord: [0, 0],
      type: "stop"
    };
    setSelectedStop(synthetic);
    setQuery(stop.stopPointName);
    setStopResults([]);
    recordRecentStop(stop.stopPointId, stop.stopPointName, stop.stopPointParentName);
    onSelect(synthetic);
  }

  function handleClearRecentStops() {
    setRecentStops([]);
    clearRecentStops(setError);
  }

  function handleClear() {
    setSelectedStop(null);
    setQuery('');
    setStopResults([]);
    onClear?.();
    inputRef.current?.focus();
  }

  const inputClassName = compact
    ? "w-full rounded-sm border border-gray-300 bg-white px-2 py-px pr-6 text-sm text-gray-800"
    : "w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-xs outline-hidden transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

  const showRecentStops = isLoggedIn && inputFocused && query.trim().length < 3 && recentStops.length > 0;

  return (
    <div className="relative flex-1">
      <Combobox onChange={(loc: StopFinderLocation | null) => { if (loc) { handleStopSelect(loc); } }}>
        <ComboboxInput
          ref={inputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Sök hållplats…"
          className={inputClassName}
        />
        {stopResults.length > 0 && (
          <ComboboxOptions static className="absolute left-0 right-0 top-full z-30 mt-1 rounded-sm border border-gray-200 bg-white shadow-md">
            {stopResults.map(loc => (
              <ComboboxOption
                key={loc.id}
                value={loc}
                className="cursor-pointer px-3 py-1 text-sm data-focus:bg-[#184fc2] data-focus:text-white"
              >
                {loc.disassembledName ?? loc.name}
                {loc.parent?.name && (
                  <span className="ml-1 text-xs opacity-60">{loc.parent.name}</span>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </Combobox>
      {showRecentStops && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-sm border border-gray-200 bg-white shadow-md">
          {recentStops.map(stop => (
            <div
              key={stop.stopPointId}
              onMouseDown={(e) => { e.preventDefault(); handleRecentStopSelect(stop); }}
              className="cursor-pointer px-3 py-1 text-sm text-gray-800 hover:bg-[#184fc2] hover:text-white"
            >
              {stop.stopPointName}
              {stop.stopPointParentName && (
                <span className="ml-1 text-xs opacity-60">{stop.stopPointParentName}</span>
              )}
            </div>
          ))}
          <div className="border-t border-gray-200" />
          <div
            onMouseDown={(e) => { e.preventDefault(); handleClearRecentStops(); }}
            className="cursor-pointer px-3 py-1 text-sm text-gray-800 hover:bg-[#184fc2] hover:text-white"
          >
            Rensa
          </div>
        </div>
      )}
      {(selectedStop || query.length > 0) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <IoCloseCircle className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </button>
      )}
    </div>
  );
}

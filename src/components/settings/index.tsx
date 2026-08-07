import { useContext, useEffect, useState } from "react";

import { fetchRouteGroupStops } from "../../communication/backend.ts";
import { DEFAULT_SETTINGS, MAX_FAVOURITE_STOPS } from "../../communication/constant.ts";
import { TransportationIconCommon } from "../common/line";
import { ModalDialog } from "../common/modal-dialog";
import { SLButton } from "../common/sl-button";
import { StopAutocomplete } from "../common/stop-autocomplete";
import InDebugModeContext from "../../contexts/debug-context.ts";
import { FavouriteStop, RouteGroupStops } from "../../types/backend.ts";
import { StopFinderLocation } from "../../types/sl-journeyplaner-responses.ts";
import { toTransportationMode } from "../../util/transport-mode.ts";
import "./input.css";

type Props = {
  settingsOpen: boolean,
  setSettingsOpen: (open: boolean) => void,
  currentSettings: SettingsData,
  currentFavourites: FavouriteStop[],
  onSave: (data: SettingsData, favourites: FavouriteStop[]) => void,
}

export function Settings({settingsOpen, setSettingsOpen, currentSettings, currentFavourites, onSave}: Props) {
  const {inDebugMode, setInDebugMode} = useContext(InDebugModeContext);
  const [pendingDebugMode, setPendingDebugMode] = useState<boolean>(inDebugMode);
  const [pendingUseAiInterpretation, setPendingUseAiInterpretation] = useState<boolean>(currentSettings.useAiInterpretation);
  const [selectedStop, setSelectedStop] = useState<SettingsData | null>(currentSettings);
  const [autocompleteKey, setAutocompleteKey] = useState(0);
  const [autocompleteInitialQuery, setAutocompleteInitialQuery] = useState(currentSettings.stopPointName);
  const [pendingFavourites, setPendingFavourites] = useState<FavouriteStop[]>(currentFavourites);
  const [routeGroupStops, setRouteGroupStops] = useState<RouteGroupStops[] | null>(null);
  const [stopsError, setStopsError] = useState("");

  const favouriteIds = new Set(pendingFavourites.map(stop => stop.stopId));
  // Favourites whose stop is in no fetched group — either the dataset is unavailable or the stop has left
  // the timetable. Rendered from the stored name so they can always be removed.
  const orphanFavourites = routeGroupStops === null ? [] : pendingFavourites.filter(
    favourite => !routeGroupStops.some(group => group.stops.some(stop => stop.stopId === favourite.stopId)));

  // Fetched on first open and kept for the page session; the catalogue changes at most nightly. A local
  // error message rather than ErrorContext, because Layout renders no ErrorHandler behind the backdrop.
  useEffect(() => {
    if (settingsOpen && routeGroupStops === null) {
      fetchRouteGroupStops(setStopsError).then(setRouteGroupStops);
    }
  }, [settingsOpen, routeGroupStops]);

  function toggleFavourite(stopId: string, stopName: string) {
    setPendingFavourites(previous => previous.some(stop => stop.stopId === stopId)
      ? previous.filter(stop => stop.stopId !== stopId)
      : [...previous, { stopId, stopName }]);
  }

  function handleStopSelect(location: StopFinderLocation) {
    setSelectedStop({
      stopPointId: location.id,
      stopPointName: location.disassembledName ?? location.name,
      useAiInterpretation: pendingUseAiInterpretation,
    });
  }

  function handleDefault() {
    setSelectedStop(DEFAULT_SETTINGS);
    setAutocompleteInitialQuery(DEFAULT_SETTINGS.stopPointName);
    setAutocompleteKey(k => k + 1);
  }

  function handleClose() {
    setPendingDebugMode(inDebugMode);
    setPendingUseAiInterpretation(currentSettings.useAiInterpretation);
    setSelectedStop(currentSettings);
    setAutocompleteInitialQuery(currentSettings.stopPointName);
    setAutocompleteKey(k => k + 1);
    setPendingFavourites(currentFavourites);
    setSettingsOpen(false);
  }

  function handleSave() {
    if (!selectedStop) {
      return;
    }
    setInDebugMode(pendingDebugMode);
    onSave({ ...selectedStop, useAiInterpretation: pendingUseAiInterpretation }, pendingFavourites);
    setSettingsOpen(false);
  }

  return (
    <ModalDialog isOpen={settingsOpen} onClose={handleClose} title="Inställningar" actions={<SLButton onClick={handleSave} disabled={!selectedStop}>Spara</SLButton>}>
      <div className="flex flex-col gap-5 font-size-settings">

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingUseAiInterpretation}
              onChange={(e) => setPendingUseAiInterpretation(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <span className="font-medium text-gray-700">Använd AI-tolkning av avvikelser</span>
          </label>
          <p className="text-sm text-gray-500">
            När aktiv filtreras tillgänglighetsavvikelser bort och du kan dölja enskilda avvikelser.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingDebugMode}
              onChange={(e) => setPendingDebugMode(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <span className="font-medium text-gray-700">Debug-läge</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700">
            Hållplats
          </label>
          <div className="flex items-center gap-2">
            <StopAutocomplete
              key={autocompleteKey}
              initialQuery={autocompleteInitialQuery}
              onSelect={handleStopSelect}
              onClear={() => setSelectedStop(null)}
            />
            <SLButton onClick={handleDefault}>
              Standard
            </SLButton>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700">
            Favorithållplatser
          </label>
          <p className="text-sm text-gray-500">
            Markera hållplatser som ska visas tydligare i Aktuell trafik. Max {MAX_FAVOURITE_STOPS}.
            Valda: {pendingFavourites.length}.
          </p>

          {stopsError && <p className="text-sm text-gray-600">{stopsError}</p>}
          {routeGroupStops !== null && routeGroupStops.length === 0 && (
            <p className="text-sm text-gray-600">
              Trafikdata är inte tillgänglig just nu — inga hållplatser att välja.
            </p>
          )}

          <div className="max-h-[40vh] overflow-y-auto rounded-sm border border-gray-200 p-2">
            {orphanFavourites.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-sm text-gray-500">Valda (ej i aktuell trafikdata)</p>
                {orphanFavourites.map(favourite => (
                  <label key={favourite.stopId} className="flex cursor-pointer items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => toggleFavourite(favourite.stopId, favourite.stopName)}
                      className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span className="font-medium text-gray-700">{favourite.stopName}</span>
                  </label>
                ))}
              </div>
            )}

            {routeGroupStops?.map(group => (
              <div key={`${group.transportMode}:${group.routeGroup}`} className="mb-3 last:mb-0">
                <p className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                  <TransportationIconCommon
                    mode={toTransportationMode(group.transportMode)}
                    className="size-5 shrink-0"
                  />
                  {group.displayName}
                </p>
                {group.stops.map(stop => {
                  const checked = favouriteIds.has(stop.stopId);
                  return (
                    <label
                      key={`${group.transportMode}:${group.routeGroup}:${stop.stopId}`}
                      className="flex cursor-pointer items-center gap-2 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && favouriteIds.size >= MAX_FAVOURITE_STOPS}
                        onChange={() => toggleFavourite(stop.stopId, stop.stopName)}
                        className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200 disabled:opacity-40"
                      />
                      <span className="font-medium text-gray-700">{stop.stopName}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>
    </ModalDialog>
  );
}

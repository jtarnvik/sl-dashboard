import {useContext, useMemo, useState} from "react";
import axios from "axios";
import {IoCloseCircle} from "react-icons/io5";
import {DEFAULT_SETTINGS, URL_GET_STOP_POINT} from "../../communication/constant.ts";
import {ModalDialog} from "../common/modal-dialog";
import {SLButton} from "../common/sl-button";
import InDebugModeContext from "../../contexts/debug-context.ts";
import {StopFinderResponse} from "../../types/sl-journeyplaner-responses.ts";
import "./input.css";

type Props = {
  settingsOpen: boolean,
  setSettingsOpen: (open: boolean) => void,
  currentSettings: SettingsData,
  onSave: (data: SettingsData) => void,
}

export function Settings({settingsOpen, setSettingsOpen, currentSettings, onSave}: Props) {
  const MAX_RESULTS = 5;

  const {inDebugMode, setInDebugMode} = useContext(InDebugModeContext);
  const [pendingDebugMode, setPendingDebugMode] = useState<boolean>(inDebugMode);
  const [pendingUseAiInterpretation, setPendingUseAiInterpretation] = useState<boolean>(currentSettings.useAiInterpretation);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResponse, setSearchResponse] = useState<StopFinderResponse | undefined>(undefined);
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [selectedStop, setSelectedStop] = useState<SettingsData | null>(currentSettings);

  function stopPointSearch() {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return;
    }

    setSearchInProgress(true);
    setSearchResponse(undefined);

    const url = URL_GET_STOP_POINT(trimmed);
    axios.get(url)
      .then(function (response) {
        setSearchResponse(response.data);
      })
      .catch(function (error) {
        console.log(error);
      })
      .finally(function () {
        setSearchInProgress(false);
      });
  }

  function handleDefault() {
    setSearchTerm("");
    setSearchResponse(undefined);
    setSelectedStop(DEFAULT_SETTINGS);
  }

  function handleClose() {
    // Reset staged state on close so the modal always opens fresh with the current values.
    setPendingDebugMode(inDebugMode);
    setPendingUseAiInterpretation(currentSettings.useAiInterpretation);
    setSelectedStop(currentSettings);
    setSearchTerm("");
    setSearchResponse(undefined);
    setSettingsOpen(false);
  }

  function handleSave() {
    if (!selectedStop) {
      return;
    }
    setInDebugMode(pendingDebugMode);
    onSave({ ...selectedStop, useAiInterpretation: pendingUseAiInterpretation });
    setSettingsOpen(false);
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResponse(undefined);
  }

  const trimmedSearchTerm = useMemo(() => searchTerm.trim(), [searchTerm]);
  const totalResults = searchResponse?.locations?.length ?? 0;
  const visibleResults = searchResponse?.locations?.slice(0, MAX_RESULTS) ?? [];

  return (
    <ModalDialog isOpen={settingsOpen} onClose={handleClose} title="Inställningar">
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
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    stopPointSearch();
                  }
                }}
                placeholder="Sök hållplats…"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-xs outline-hidden transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {trimmedSearchTerm.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-400 hover:text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-blue-200"
                >
                  <IoCloseCircle className="h-5 w-5" />
                </button>
              )}
            </div>

            <SLButton
              onClick={stopPointSearch}
              disabled={searchInProgress || trimmedSearchTerm.length === 0}
            >
              Sök
            </SLButton>
          </div>

          <p className="text-gray-500">
            Tips: tryck Enter för att söka
          </p>
        </div>

        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
              <tr>
                <th className="w-1/2 px-3 py-2 text-left font-semibold text-gray-600">
                  Hållplats
                </th>
                <th className="w-1/2 px-3 py-2 text-left font-semibold text-gray-600">
                  Område
                </th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {visibleResults.map((itm) => {
                const stopData: SettingsData = {
                  stopPointId: itm.id,
                  stopPointName: itm.disassembledName ?? itm.name,
                  useAiInterpretation: pendingUseAiInterpretation,
                };
                const isSelected = selectedStop?.stopPointId === itm.id;
                return (
                  <tr
                    key={itm.id}
                    className={`cursor-pointer ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedStop(stopData)}
                  >
                    <td className="px-3 py-2 text-gray-900">
                      {itm.disassembledName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {itm.parent?.name ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {visibleResults.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-4 text-gray-500">
                    Inga träffar än.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>

          {totalResults > MAX_RESULTS && (
            <div className="text-xs text-gray-500">
              Visar {Math.min(MAX_RESULTS, totalResults)} av {totalResults}
            </div>
          )}

          {selectedStop && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Vald hållplats: <strong>{selectedStop.stopPointName}</strong>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <SLButton onClick={handleDefault}>
              Standard
            </SLButton>
            <SLButton onClick={handleSave} disabled={!selectedStop}>
              Spara
            </SLButton>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}

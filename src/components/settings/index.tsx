import {ModalDialog} from "../common/modal-dialog";
import {useMemo, useState} from "react";
import {URL_GET_STOP_POINT} from "../../communication/constant.ts";
import axios from "axios";
import {StopFinderResponse} from "../../types/sl-journeyplaner-responses.ts";
import {SLButton} from "../common/sl-button";
import {IoCloseCircle} from "react-icons/io5";
import "./input.css"

type Props = {
  settingsOpen: boolean,
  setSettingsOpen: (open: boolean) => void,
  applySettings: (data: SettingsData) => void,
  removeSettings: () => void
}

export function Settings({settingsOpen, setSettingsOpen, applySettings, removeSettings}: Props) {
  const MAX_RESULTS = 5;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResponse, setSearchResponse] = useState<StopFinderResponse | undefined>(undefined);
  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [selectedStopPointId, setSelectedStopPointId] = useState<string | undefined>(undefined);

  function stopPointSearch() {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setSearchInProgress(true);
    setSearchResponse(undefined);

    const url = URL_GET_STOP_POINT(trimmed);
    axios.get(url)
      .then(function (response) {
        setSearchResponse(response.data);
      })
      .catch(function (error) {
        // TODO: Log error
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
        setSearchInProgress(false);
      });
  }

  function close() {
    setSettingsOpen(false);
    clearSettingsModal();
  }

  function clearSettingsModal() {
    setSearchTerm("");
    setSearchResponse(undefined);
    setSelectedStopPointId(undefined);
  }

  function applySelectedStopPoint() {
    if (!selectedStopPointId) return;

    const selected = visibleResults.find((x) => x.id === selectedStopPointId);
    if (!selected) return;

    applySettings({
      stopPointId: selected.id,
      stopPointName: selected.disassembledName ?? selected.name
    });

    close();
  }

  const trimmedSearchTerm = useMemo(() => searchTerm.trim(), [searchTerm]);
  const totalResults = searchResponse?.locations?.length ?? 0;
  const visibleResults = searchResponse?.locations?.slice(0, MAX_RESULTS) ?? [];

  return (
    <ModalDialog isOpen={settingsOpen} onClose={close} title="Inställningar">
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Hållplats
          </label>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") stopPointSearch();
                }}
                placeholder="Sök hållplats…"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {trimmedSearchTerm.length > 0 && (
                <button
                  type="button"
                  onClick={clearSettingsModal}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
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

          <p className="text-xs text-gray-500">
            Tips: tryck Enter för att söka
          </p>
        </div>

        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                  <span className="sr-only">Välj</span>
                </th>
                <th className="w-1/2 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                  Hållplats
                </th>
                <th className="w-1/2 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                  Område
                </th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {visibleResults.map((itm) => {
                const isSelected = itm.id === selectedStopPointId;
                return (
                  <tr
                    key={itm.id}
                    className={`hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                    onClick={() => setSelectedStopPointId(itm.id)}
                  >
                    <td className="px-3 py-2 text-sm text-gray-900">
                      <input
                        type="radio"
                        name="selectedStopPoint"
                        checked={isSelected}
                        onChange={() => setSelectedStopPointId(itm.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {itm.disassembledName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                    {itm.parent?.name ?? "—"}
                  </td>
                </tr>
                );
              })}
              {visibleResults.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-sm text-gray-500">
                    Inga träffar än.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>

          {totalResults > MAX_RESULTS &&
            <div className="text-xs text-gray-500">
              Visar {Math.min(MAX_RESULTS, totalResults)} ({totalResults})
            </div>
          }

          <div className="flex justify-end gap-2">
            <SLButton
              onClick={removeSettings}
            >
              Default
            </SLButton>
            <SLButton
              onClick={applySelectedStopPoint}
              disabled={!selectedStopPointId}
            >
              Använd
            </SLButton>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
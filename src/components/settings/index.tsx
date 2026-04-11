import { useContext, useState } from "react";

import { DEFAULT_SETTINGS } from "../../communication/constant.ts";
import { ModalDialog } from "../common/modal-dialog";
import { SLButton } from "../common/sl-button";
import { StopAutocomplete } from "../common/stop-autocomplete";
import InDebugModeContext from "../../contexts/debug-context.ts";
import { StopFinderLocation } from "../../types/sl-journeyplaner-responses.ts";
import "./input.css";

type Props = {
  settingsOpen: boolean,
  setSettingsOpen: (open: boolean) => void,
  currentSettings: SettingsData,
  onSave: (data: SettingsData) => void,
}

export function Settings({settingsOpen, setSettingsOpen, currentSettings, onSave}: Props) {
  const {inDebugMode, setInDebugMode} = useContext(InDebugModeContext);
  const [pendingDebugMode, setPendingDebugMode] = useState<boolean>(inDebugMode);
  const [pendingUseAiInterpretation, setPendingUseAiInterpretation] = useState<boolean>(currentSettings.useAiInterpretation);
  const [selectedStop, setSelectedStop] = useState<SettingsData | null>(currentSettings);
  const [autocompleteKey, setAutocompleteKey] = useState(0);
  const [autocompleteInitialQuery, setAutocompleteInitialQuery] = useState(currentSettings.stopPointName);

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

      </div>
    </ModalDialog>
  );
}

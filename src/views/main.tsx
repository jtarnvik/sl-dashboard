import { useContext, useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { SITE_SKOGSLOPARVAGEN_16_CHAR } from '../communication/constant.ts';
import { ErrorHandler } from '../components/error-handler';
import { Departures } from '../components/pane/departures';
import { Deviations } from '../components/pane/deviations';
import { Routes } from '../components/pane/routes';
import { Settings } from '../components/settings';
import { SLButton } from '../components/common/sl-button';
import ErrorContext from '../contexts/error-context.ts';
import InDebugModeContext from '../contexts/debug-context.ts';
import PageTitleContext from '../contexts/page-title-context.ts';
import { SETTINGS_KEY } from '../types/common-constants.ts';

export function Main() {
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settingsData, setSettingsData, { removeItem, isPersistent }] = useLocalStorageState<SettingsData>(SETTINGS_KEY, {
    defaultValue: { stopPointId: SITE_SKOGSLOPARVAGEN_16_CHAR, stopPointName: "Skogslöparvägen" }
  });
  const [inDebugMode, setInDebugMode] = useState<boolean>(false);

  useEffect(() => {
    setHeading(settingsData.stopPointName);
  }, [settingsData.stopPointName]);

  if (!isPersistent) {
    console.log("Settings data not persistent");
    setError("Settings data not persistent. Please reload the page.");
  }

  return (
    <InDebugModeContext.Provider value={{ inDebugMode, setInDebugMode }}>
      <main>
        <div className="flex flex-col space-y-2 px-2 mb-2">
          <ErrorHandler></ErrorHandler>
          <Departures stopPoint16Chars={settingsData.stopPointId} />
          <Routes settingsData={settingsData} />
          <div className="flex justify-between">
            <div className="w-1/2">
              <Deviations />
            </div>
            <div className="flex justify-end items-start">
              <SLButton onClick={() => setSettingsOpen(true)} thin>Inställningar</SLButton>
            </div>
          </div>
        </div>
        {inDebugMode && (
          <div className="px-2 mb-2 flex gap-2">
            <SLButton thin onClick={() => setError("Testfel: något gick snett.", () => { /* no-op retry */ })}>
              Utlös testfel
            </SLButton>
          </div>
        )}
        <Settings settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} applySettings={setSettingsData} removeSettings={removeItem} />
      </main>
    </InDebugModeContext.Provider>
  );
}

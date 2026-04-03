import { useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '../communication/constant.ts';
import { saveSettings } from '../communication/backend.ts';
import { ErrorHandler } from '../components/error-handler';
import { Departures } from '../components/pane/departures';
import { Deviations } from '../components/pane/deviations';
import { Routes } from '../components/pane/routes';
import { Settings } from '../components/settings';
import { SLButton } from '../components/common/sl-button';
import ErrorContext from '../contexts/error-context.ts';
import InDebugModeContext from '../contexts/debug-context.ts';
import PageTitleContext from '../contexts/page-title-context.ts';
import { LoginTeaser } from '../components/pane/login-teaser';
import { useUser, useUserLoginState, UserLoginState } from '../hook/use-user.ts';

export function Main() {
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const { user, updateSettings } = useUser();
  const loginState = useUserLoginState();
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [inDebugMode, setInDebugMode] = useState<boolean>(false);

  const isLoggedIn = loginState === UserLoginState.LoggedIn;

  const settingsData: SettingsData = isLoggedIn && user?.settings
    ? { stopPointId: user.settings.stopPointId, stopPointName: user.settings.stopPointName }
    : DEFAULT_SETTINGS;

  useEffect(() => {
    setHeading(settingsData.stopPointName);
  }, [settingsData.stopPointName, setHeading]);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener('openSettings', openSettings);
    return () => window.removeEventListener('openSettings', openSettings);
  }, []);

  async function handleSaveSettings(data: SettingsData) {
    const success = await saveSettings(data, setError);
    if (success) {
      updateSettings(data);
    }
  }

  return (
    <InDebugModeContext.Provider value={{ inDebugMode, setInDebugMode }}>
      <main>
        <div className="flex flex-col space-y-2 px-2 mb-2">
          <ErrorHandler></ErrorHandler>
          <Departures stopPoint16Chars={settingsData.stopPointId} />
          {isLoggedIn ? (
            <>
              {/* key forces a full remount when the stop changes, resetting all route planning state */}
              <Routes key={settingsData.stopPointId} settingsData={settingsData} />
              <Deviations />
            </>
          ) : (
            loginState === UserLoginState.NotLoggedIn && <LoginTeaser />
          )}
        </div>
        {inDebugMode && (
          <div className="px-2 mb-2 flex gap-2">
            <SLButton thin onClick={() => setError("Testfel: något gick snett.", () => { /* no-op retry */ })}>
              Utlös testfel
            </SLButton>
          </div>
        )}
        {isLoggedIn && (
          <Settings
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            currentSettings={settingsData}
            onSave={handleSaveSettings}
          />
        )}
      </main>
    </InDebugModeContext.Provider>
  );
}

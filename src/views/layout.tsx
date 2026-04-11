import { useContext, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorBoundryFallback } from '../components/error-boundry-fallback';
import { Navbar } from '../components/navbar';
import { OfflineBanner } from '../components/offline-banner';
import { Settings } from '../components/settings';
import { saveSettings } from '../communication/backend.ts';
import ErrorContext from '../contexts/error-context.ts';
import InDebugModeContext from '../contexts/debug-context.ts';
import { useUser, useUserLoginState, UserLoginState } from '../hook/use-user.ts';
import { loadStopHint } from '../util/stop-hint.ts';
import { DEFAULT_SETTINGS } from '../communication/constant.ts';

export function Layout() {
  const { setError } = useContext(ErrorContext);
  const { user, updateSettings } = useUser();
  const loginState = useUserLoginState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inDebugMode, setInDebugMode] = useState(false);

  const isLoggedIn = loginState === UserLoginState.LoggedIn;
  const isOffline = loginState === UserLoginState.BackendOffline;

  const settingsData: SettingsData = isLoggedIn && user?.settings
    ? {
        stopPointId: user.settings.stopPointId,
        stopPointName: user.settings.stopPointName,
        useAiInterpretation: user.settings.useAiInterpretation,
      }
    : (loadStopHint() ?? DEFAULT_SETTINGS);

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
      <Navbar />
      <div className="h-14" />
      {isOffline && (
        <div className="px-2 pt-2 mb-2">
          <OfflineBanner />
        </div>
      )}
      <ErrorBoundary FallbackComponent={ErrorBoundryFallback}>
        <Outlet />
      </ErrorBoundary>
      {isLoggedIn && (
        <Settings
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          currentSettings={settingsData}
          onSave={handleSaveSettings}
        />
      )}
    </InDebugModeContext.Provider>
  );
}

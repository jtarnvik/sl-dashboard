import { useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '../communication/constant.ts';
import { loadStopHint } from '../util/stop-hint.ts';
import { ErrorHandler } from '../components/error-handler';
import { Departures } from '../components/pane/departures';
import { Deviations } from '../components/pane/deviations';
import { Routes } from '../components/pane/routes';
import { SLButton } from '../components/common/sl-button';
import ErrorContext from '../contexts/error-context.ts';
import InDebugModeContext from '../contexts/debug-context.ts';
import PageTitleContext from '../contexts/page-title-context.ts';
import { LoginTeaser } from '../components/pane/login-teaser';
import { useUser, useUserLoginState, UserLoginState } from '../hook/use-user.ts';

export function Main() {
  const { setError } = useContext(ErrorContext);
  const { setHeading } = useContext(PageTitleContext);
  const { user } = useUser();
  const loginState = useUserLoginState();
  const [inDebugMode, setInDebugMode] = useState<boolean>(false);

  const isLoggedIn = loginState === UserLoginState.LoggedIn;

  const settingsData: SettingsData = isLoggedIn && user?.settings
    ? {
        stopPointId: user.settings.stopPointId,
        stopPointName: user.settings.stopPointName,
        useAiInterpretation: user.settings.useAiInterpretation,
      }
    : (loadStopHint() ?? DEFAULT_SETTINGS);

  useEffect(() => {
    setHeading(settingsData.stopPointName);
  }, [settingsData.stopPointName, setHeading]);

  return (
    <InDebugModeContext.Provider value={{ inDebugMode, setInDebugMode }}>
      <main>
        <div className="flex flex-col space-y-2 px-2 mb-2">
          <ErrorHandler></ErrorHandler>
          <Departures key={`departures-${settingsData.useAiInterpretation}`} stopPoint16Chars={settingsData.stopPointId} />
          {isLoggedIn ? (
            <>
              {/* key forces a full remount when the stop or AI setting changes */}
              <Routes key={`${settingsData.stopPointId}-${settingsData.useAiInterpretation}`} settingsData={settingsData} />
              <Deviations key={`deviations-${settingsData.useAiInterpretation}`} />
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
      </main>
    </InDebugModeContext.Provider>
  );
}

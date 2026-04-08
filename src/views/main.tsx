import { useContext, useEffect, useRef, useState } from 'react';

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
  const { inDebugMode } = useContext(InDebugModeContext);

  // Generation counters — increment to force a full remount and re-fetch of the pane.
  // Each counter is updated by the events that should trigger a refresh of that pane:
  //   departuresGen: AI interpretation setting changed, hidden deviations reset
  //   routesGen:     stop point changed, AI interpretation setting changed
  //   deviationsGen: AI interpretation setting changed, hidden deviations reset
  const [departuresGen, setDeparturesGen] = useState(0);
  const [routesGen, setRoutesGen] = useState(0);
  const [deviationsGen, setDeviationsGen] = useState(0);

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

  // Increment generation counters when settings change, but skip the initial render.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setDeparturesGen(g => g + 1);
    setRoutesGen(g => g + 1);
    setDeviationsGen(g => g + 1);
  }, [settingsData.stopPointId, settingsData.useAiInterpretation]);

  useEffect(() => {
    const handleReset = () => {
      setDeparturesGen(g => g + 1);
      setDeviationsGen(g => g + 1);
    };
    window.addEventListener('hiddenDeviationsReset', handleReset);
    return () => window.removeEventListener('hiddenDeviationsReset', handleReset);
  }, []);

  return (
    <main>
        <div className="flex flex-col space-y-2 px-2 mb-2">
          <ErrorHandler></ErrorHandler>
          <Departures key={`dep-${departuresGen}`} stopPoint16Chars={settingsData.stopPointId} />
          {isLoggedIn ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr auto' }}>
              <Routes key={`routes-${routesGen}`} settingsData={settingsData} />
              <div className="col-start-2 row-start-1">
                <Deviations key={`dev-${deviationsGen}`} />
              </div>
            </div>
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
  );
}

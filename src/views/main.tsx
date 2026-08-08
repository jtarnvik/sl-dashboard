import { useContext, useEffect, useRef, useState } from 'react';

import { DEFAULT_SETTINGS } from '../communication/constant.ts';
import { fetchRouteGroups } from '../communication/backend.ts';
import { loadStopHint } from '../util/stop-hint.ts';
import { ErrorHandler } from '../components/error-handler';
import { Departures } from '../components/pane/departures';
import { Deviations } from '../components/pane/deviations';
import { Routes } from '../components/pane/routes';
import { View } from '../components/common/view';
import PageTitleContext from '../contexts/page-title-context.ts';
import { LoginTeaser } from '../components/pane/login-teaser';
import { useUser, useUserLoginState, UserLoginState } from '../hook/use-user.ts';
import { MonitoredRouteGroup } from '../types/backend.ts';

export function Main() {
  const { setHeading } = useContext(PageTitleContext);
  const { user } = useUser();
  const loginState = useUserLoginState();

  // Generation counters — increment to force a full remount and re-fetch of the pane.
  // Each counter is updated by the events that should trigger a refresh of that pane:
  //   departuresGen: AI interpretation setting changed, hidden deviations reset
  //   routesGen:     stop point changed, AI interpretation setting changed
  //   deviationsGen: AI interpretation setting changed, hidden deviations reset
  const [departuresGen, setDeparturesGen] = useState(0);
  const [routesGen, setRoutesGen] = useState(0);
  const [deviationsGen, setDeviationsGen] = useState(0);

  // Which lines have live traffic data, so Departures knows which of its rows can lead there. Fetched here
  // rather than in the pane because the pane is remounted by its generation key whenever settings change,
  // and this list does not.
  const [routeGroups, setRouteGroups] = useState<MonitoredRouteGroup[]>([]);

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
    if (!isLoggedIn) {
      return;
    }
    // No error handler on purpose: failing to learn which lines are monitored costs a shortcut, not the
    // departures themselves, and a banner over the main page would be out of proportion to that.
    fetchRouteGroups().then(setRouteGroups);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleReset = () => {
      setDeparturesGen(g => g + 1);
      setDeviationsGen(g => g + 1);
    };
    window.addEventListener('hiddenDeviationsReset', handleReset);
    return () => window.removeEventListener('hiddenDeviationsReset', handleReset);
  }, []);

  return (
    <View>
      <ErrorHandler />
      <Departures
        key={`dep-${departuresGen}`}
        stopPoint16Chars={settingsData.stopPointId}
        routeGroups={routeGroups}
      />
      {/* Four explicit rows so both panes can span them with grid-template-rows: subgrid — that is what makes
          row N of the routes form line up with row N of the deviations column, whatever height the native time
          input turns out to have. Each pane places itself; the results panel lands on row 5. */}
      {isLoggedIn ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: '1fr auto', gridTemplateRows: 'repeat(4, auto)' }}>
          <Routes key={`routes-${routesGen}`} settingsData={settingsData} />
          <Deviations key={`dev-${deviationsGen}`} />
        </div>
      ) : (
        loginState === UserLoginState.NotLoggedIn && <LoginTeaser />
      )}
    </View>
  );
}

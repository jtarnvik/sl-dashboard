import {useEffect, useRef, useState} from 'react'
import './App.css'
import ErrorContext from "./contexts/error-context.ts";
import {Departures} from "./components/pane/departures";
import {ErrorHandler} from "./components/error-handler";
import {Navbar} from "./components/navbar";
import {Routes} from "./components/pane/routes";
import {SLButton} from "./components/common/sl-button";
import {Settings} from "./components/settings";
import {SITE_SKOGSLOPARVAGEN_16_CHAR} from "./communication/constant.ts";
import useLocalStorageState from 'use-local-storage-state';
import {SETTINGS_KEY} from "./types/common-constants.ts";
import InDebugModeContext from "./contexts/debug-context.ts";
import {Deviations} from "./components/pane/deviations";
import {ErrorBoundary} from "react-error-boundary";
import {ErrorBoundryFallback} from "./components/error-boundry-fallback";

function App() {
  const performManualUpdateNextDepartureRef = useRef<ScheduleOperations>(null);
  const [error, setError] = useState<string>("");
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settingsData, setSettingsData, {removeItem, isPersistent}] = useLocalStorageState<SettingsData>(SETTINGS_KEY, {
    defaultValue: {stopPointId: SITE_SKOGSLOPARVAGEN_16_CHAR, stopPointName: "Skogslöparvägen"}
  })
  const [inDebugMode, setInDebugMode] = useState<boolean>(false);

  useEffect(() => {
    const navbar = document.querySelector("nav");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    }
  }, []);

  function onManualUpdate() {
    if (performManualUpdateNextDepartureRef.current) {
      performManualUpdateNextDepartureRef.current.manualUpdate();
    }
  }

  if (!isPersistent) {
    console.log("Settings data not persistent");
    setError("Settings data not persistent. Please reload the page.");
  }

  return (
    <ErrorContext.Provider value={{error, setError}}>
      <div>
        <InDebugModeContext.Provider value={{inDebugMode, setInDebugMode}}>
          <Navbar onManualUpdate={onManualUpdate} heading={settingsData.stopPointName} />
          <ErrorBoundary FallbackComponent={ErrorBoundryFallback}>
            <main>
              <div className="flex flex-col space-y-2 px-2 mb-2">
                <div style={{minHeight: `${navbarHeight}px`}} />
                <ErrorHandler></ErrorHandler>
                <Deviations />
                <Departures performManualUpdate={performManualUpdateNextDepartureRef} stopPoint16Chars={settingsData.stopPointId} />
                <Routes settingsData={settingsData} />
                <div className="flex justify-end">
                  <SLButton onClick={() => setSettingsOpen(true)} thin>Inställningar</SLButton>
                </div>
              </div>
              <Settings settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} applySettings={setSettingsData} removeSettings={removeItem} />
            </main>
          </ErrorBoundary>
        </InDebugModeContext.Provider>
      </div>
    </ErrorContext.Provider>
  )
}

export default App

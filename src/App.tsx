import {useEffect, useRef, useState} from 'react';
import {ErrorBoundary} from "react-error-boundary";
import useLocalStorageState from 'use-local-storage-state';
import {SITE_SKOGSLOPARVAGEN_16_CHAR, URL_BACKEND_GET_CHECK_AUTH} from "./communication/constant.ts";
import {ErrorBoundryFallback} from "./components/error-boundry-fallback";
import {ErrorHandler} from "./components/error-handler";
import {Navbar} from "./components/navbar";
import {Departures} from "./components/pane/departures";
import {Deviations} from "./components/pane/deviations";
import {Routes} from "./components/pane/routes";
import {Settings} from "./components/settings";
import {SLButton} from "./components/common/sl-button";
import ErrorContext from "./contexts/error-context.ts";
import InDebugModeContext from "./contexts/debug-context.ts";
import {SETTINGS_KEY} from "./types/common-constants.ts";
import './App.css';
import {User} from "./types/backend.ts";
import backend from "./communication/backend.ts";

function App() {
  const performManualUpdateNextDepartureRef = useRef<ScheduleOperations>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setErrorMsg] = useState<string>("");
  const [retry, setRetry] = useState<(() => void) | null>(null);

  function setError(message: string, retryFn?: () => void) {
    setErrorMsg(message);
    setRetry(retryFn ? () => retryFn : null);
  }
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await backend.get(URL_BACKEND_GET_CHECK_AUTH);
        setUser(response.data);
      } catch {
        setUser(null);
      }
    }

    const handleUnauthorized = () => setUser(null);
    window.addEventListener("unauthorized", handleUnauthorized);

    checkAuth();

    return () => window.removeEventListener("unauthorized", handleUnauthorized);
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
    <ErrorContext.Provider value={{error, retry, setError}}>
      <div>
        <InDebugModeContext.Provider value={{inDebugMode, setInDebugMode}}>
          <Navbar onManualUpdate={onManualUpdate} heading={settingsData.stopPointName} />
          <ErrorBoundary FallbackComponent={ErrorBoundryFallback}>
            <main>
              <div className="flex flex-col space-y-2 px-2 mb-2">
                <div style={{minHeight: `${navbarHeight}px`}} />
                <ErrorHandler></ErrorHandler>
                <Departures performManualUpdate={performManualUpdateNextDepartureRef} stopPoint16Chars={settingsData.stopPointId} />
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
                <div className="px-2 mb-2">
                  <SLButton thin onClick={() => setError("Testfel: något gick snett.", () => { /* no-op retry */ })}>
                    Utlös testfel
                  </SLButton>
                </div>
              )}
              <Settings settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} applySettings={setSettingsData} removeSettings={removeItem} />
            </main>
          </ErrorBoundary>
        </InDebugModeContext.Provider>
      </div>
    </ErrorContext.Provider>
  )
}

export default App

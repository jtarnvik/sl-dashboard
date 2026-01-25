import {useEffect, useRef, useState} from 'react'
import './App.css'
import ErrorContext from "./contexts/error-context.ts";
import {NextDeparture} from "./components/next-departure";
import {ErrorHandler} from "./components/error-handler";
import {Navbar} from "./components/navbar";
import {NextCity} from "./components/next-city";
import {SLButton} from "./components/common/sl-button";
import {Settings} from "./components/settings";
import {SITE_SKOGSLOPARVAGEN_16_CHAR} from "./communication/constant.ts";
import useLocalStorageState from 'use-local-storage-state';
import {SETTINGS_KEY} from "./types/common-constants.ts";

function App() {
  const performManualUpdateNextDepartureRef = useRef<ScheduleOperations>(null);
  const performManualUpdateNextCityRef = useRef<ScheduleOperations>(null);
  const [error, setError] = useState<string>("");
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settingsData, setSettingsData, { removeItem, isPersistent }] = useLocalStorageState<SettingsData>(SETTINGS_KEY, {
    defaultValue: {stopPointId: SITE_SKOGSLOPARVAGEN_16_CHAR, stopPointName: "Skogslöparvägen"}
  })

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
    if (performManualUpdateNextCityRef.current) {
      performManualUpdateNextCityRef.current.manualUpdate();
    }
  }

  if (!isPersistent) {
    console.log("Settings data not persistent");
    setError("Settings data not persistent. Please reload the page.");
  }

  return (
    <ErrorContext.Provider value={{error, setError}}>
      <div>
        <Navbar onManualUpdate={onManualUpdate} heading={settingsData.stopPointName} />
        <main>
          <div className="flex flex-col space-y-2 px-2">
            <div style={{minHeight: `${navbarHeight}px`}} />
            <ErrorHandler></ErrorHandler>
            <NextDeparture performManualUpdate={performManualUpdateNextDepartureRef} stopPoint16Chars={settingsData.stopPointId} />
            <NextCity performManualUpdate={performManualUpdateNextCityRef} />
            <div className="flex justify-end">
              <SLButton onClick={() => setSettingsOpen(true)} thin>Inställningar</SLButton>
            </div>
          </div>
          <Settings settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} applySettings={setSettingsData} removeSettings={removeItem}/>
        </main>
      </div>
    </ErrorContext.Provider>
  )
}

export default App

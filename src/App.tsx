import {useEffect, useRef, useState} from 'react'
import './App.css'
import ErrorContext from "./contexts/error-context.ts";
import {NextDeparture} from "./components/next-departure";
import {ErrorHandler} from "./components/error-handler";
import {Navbar} from "./components/navbar";
import {NextCity} from "./components/next-city";

function App() {
  const performManualUpdateNextDepartureRef = useRef<ScheduleOperations>(null);
  const performManualUpdateNextCityRef = useRef<ScheduleOperations>(null);
  const [error, setError] = useState<string>("");
  const [navbarHeight, setNavbarHeight] = useState(0);

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

  return (
    <ErrorContext.Provider value={{error, setError}}>
      <div>
        <Navbar onManualUpdate={onManualUpdate} />
        <main>
          <div className="flex flex-col space-y-2 px-2">
            <div style={{minHeight: `${navbarHeight}px`}} />
            <ErrorHandler></ErrorHandler>
            <NextDeparture performManualUpdate={performManualUpdateNextDepartureRef} />
            <NextCity performManualUpdate={performManualUpdateNextCityRef} />
          </div>
        </main>
      </div>
    </ErrorContext.Provider>
  )
}

export default App

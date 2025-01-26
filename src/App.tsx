import {useRef, useState} from 'react'
import './App.css'
import ErrorContext from "./contexts/error-context.ts";
import {NextDeparture, TrainScheduleHandle} from "./components/next-departure";
import {ErrorHandler} from "./components/error-handler";
import {Navbar} from "./components/navbar";

function App() {
  const performManualUpdateRef = useRef<TrainScheduleHandle>(null);
  const [error, setError] = useState<string>("");

  function onManualUpdate() {
    if (performManualUpdateRef.current) {
      performManualUpdateRef.current.manualUpdate();
    }
  }

  return (
    <ErrorContext.Provider value={{error, setError}}>
      <div>
        <Navbar onManualUpdate={onManualUpdate} />
        <ErrorHandler></ErrorHandler>
        <NextDeparture performManualUpdate={performManualUpdateRef}></NextDeparture>
      </div>
    </ErrorContext.Provider>
  )
}

export default App

import {useState} from 'react'
import './App.css'
import ErrorContext from "./contexts/error-context.ts";
import {NextDeparture} from "./components/next-departure";
import {ErrorHandler} from "./components/error-handler";
import {Navbar} from "./components/navbar";

function App() {
  const [error, setError] = useState<string>("");

  return (
    <ErrorContext.Provider value={{error, setError}}>
      <div>
        <Navbar />

        <ErrorHandler></ErrorHandler>
        <NextDeparture></NextDeparture>

      </div>
    </ErrorContext.Provider>
  )
}

export default App

import {useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {SlLogo} from "./components/sl-logo.tsx";
import ErrorContext from "./contexts/error-context.ts";
import {NextDeparture} from "./components/next-departure";
import {ErrorHandler} from "./components/error-handler";
import { Alert } from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import {Navbar} from "./components/navbar";

function App() {
  const [error, setError] = useState<string>("");
  const [count, setCount] = useState(0)

  return (
    <ErrorContext.Provider value={{error, setError}}>
      <Navbar />
      <ErrorHandler></ErrorHandler>
      <NextDeparture></NextDeparture>

      <div
        className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
        role="alert">
        <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
             fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium">Danger alert!</span> Change a few things up and try submitting again.
        </div>
      </div>
      <Alert color="failure" icon={HiInformationCircle}>
        <span className="font-medium">Info alert!</span> Component Change a few things up and try submitting again.
      </Alert>
      <div>
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
        Jesper was here
        <SlLogo className={""} />
        <div className="text-4xl font-bold font-mono">
          test
        </div>
      </div>
    </ErrorContext.Provider>
  )
}

export default App

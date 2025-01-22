import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'flowbite/dist/flowbite.min.js';
import {DarkThemeToggle, Flowbite} from "flowbite-react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Flowbite>
      <App />
      <DarkThemeToggle />
    </Flowbite>
  </StrictMode>,
)

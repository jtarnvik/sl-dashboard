import { createContext } from 'react';

const InDebugModeContext = createContext({
  inDebugMode: false,
  setInDebugMode: (_: boolean) => {
    // Empty by design
  }
});
export default InDebugModeContext;
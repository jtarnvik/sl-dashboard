import { createContext } from 'react';

const ErrorContext = createContext({
  error: "",
  setError: (_: string) => {
    // Empty by design
  }
});
export default ErrorContext;
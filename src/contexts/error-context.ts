import { createContext } from 'react';

const ErrorContext = createContext({
  error: "",
  retry: null as (() => void) | null,
  setError: (_error: string, _retry?: () => void) => {
    // Empty by design
  }
});
export default ErrorContext;
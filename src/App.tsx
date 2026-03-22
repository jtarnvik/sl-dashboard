import { useState, useEffect } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import ErrorContext from './contexts/error-context.ts';
import UserContext from './contexts/user-context.ts';
import { User } from './types/backend.ts';
import { checkLoginStatus, login, logout } from './communication/backend.ts';
import { Denied } from './views/Denied.tsx';
import { Main } from './views/Main.tsx';
import { PendingUsers } from './views/admin/PendingUsers.tsx';
import { ExistingUsers } from './views/admin/ExistingUsers.tsx';
import './App.css';

const router = createHashRouter([
  { path: '/', element: <Main /> },
  { path: '/denied', element: <Denied /> },
  { path: '/admin/pending', element: <PendingUsers /> },
  { path: '/admin/users', element: <ExistingUsers /> },
]);

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setErrorMsg] = useState<string>("");
  const [retry, setRetry] = useState<(() => void) | null>(null);

  function setError(message: string, retryFn?: () => void) {
    setErrorMsg(message);
    setRetry(retryFn ? () => retryFn : null);
  }

  async function handleLogout() {
    await logout(setError);
    setUser(null);
  }

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("unauthorized", handleUnauthorized);

    checkLoginStatus(setError).then(setUser);

    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, retry, setError }}>
      <UserContext.Provider value={{ user, login, logout: handleLogout }}>
        <RouterProvider router={router} />
      </UserContext.Provider>
    </ErrorContext.Provider>
  );
}

export default App;

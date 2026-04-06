import { useState, useEffect } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import ErrorContext from './contexts/error-context.ts';
import PageTitleContext from './contexts/page-title-context.ts';
import UserContext from './contexts/user-context.ts';
import { User, UserSettings } from './types/backend.ts';
import { checkLoginStatus, login, logout } from './communication/backend.ts';
import { Denied } from './views/denied.tsx';
import { Gdpr } from './views/gdpr.tsx';
import { Layout } from './views/layout.tsx';
import { Main } from './views/main.tsx';
import { MyAccount } from './views/my-account.tsx';
import { PendingUsers } from './views/admin/pending-users.tsx';
import { ExistingUsers } from './views/admin/existing-users.tsx';
import { Statistics } from './views/admin/statistics.tsx';
import { SharedRouteView } from './views/shared-route.tsx';
import './App.css';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Main /> },
      { path: '/my-account', element: <MyAccount /> },
      { path: '/admin/pending', element: <PendingUsers /> },
      { path: '/admin/users', element: <ExistingUsers /> },
      { path: '/admin/statistics', element: <Statistics /> },
      { path: '/gdpr', element: <Gdpr /> },
      { path: '/route/:id', element: <SharedRouteView /> },
    ],
  },
  { path: '/denied', element: <Denied /> },
]);

function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setErrorMsg] = useState<string>("");
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [heading, setHeading] = useState('');

  function setError(message: string, retryFn?: () => void) {
    setErrorMsg(message);
    setRetry(retryFn ? () => retryFn : null);
  }

  async function handleLogout() {
    await logout(setError);
    setUser(null);
  }

  function updateSettings(settings: UserSettings) {
    setUser(prev => prev ? { ...prev, settings } : prev);
  }

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("unauthorized", handleUnauthorized);

    checkLoginStatus(setError).then(setUser);

    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, retry, setError }}>
      <UserContext.Provider value={{ user, login, logout: handleLogout, updateSettings }}>
        <PageTitleContext.Provider value={{ heading, setHeading }}>
          <RouterProvider router={router} />
        </PageTitleContext.Provider>
      </UserContext.Provider>
    </ErrorContext.Provider>
  );
}

export default App;

import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorBoundryFallback } from '../components/error-boundry-fallback';
import { Navbar } from '../components/navbar';

export function Layout() {
  return (
    <>
      <Navbar />
      <div className="h-14" />
      <ErrorBoundary FallbackComponent={ErrorBoundryFallback}>
        <Outlet />
      </ErrorBoundary>
    </>
  );
}

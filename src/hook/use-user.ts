import { useContext } from 'react';

import UserContext from '../contexts/user-context';

export enum UserLoginState {
  Loading = 'loading',
  NotLoggedIn = 'not_logged_in',
  LoggedIn = 'logged_in',
  BackendOffline = 'backend_offline',
}

export function useUserLoginState(): UserLoginState {
  const { user, backendOffline } = useContext(UserContext);
  if (backendOffline) {
    return UserLoginState.BackendOffline;
  }
  if (user === undefined) {
    return UserLoginState.Loading;
  }
  if (user === null) {
    return UserLoginState.NotLoggedIn;
  }
  return UserLoginState.LoggedIn;
}

export function useUser() {
  return useContext(UserContext);
}
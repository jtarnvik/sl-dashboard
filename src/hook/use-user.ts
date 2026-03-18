import { useContext } from 'react';

import UserContext from '../contexts/user-context';

export enum UserLoginState {
  Loading = 'loading',
  NotLoggedIn = 'not_logged_in',
  LoggedIn = 'logged_in',
}

export function useUserLoginState(): UserLoginState {
  const { user } = useContext(UserContext);
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
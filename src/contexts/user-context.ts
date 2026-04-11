import { createContext } from 'react';
import { User, UserSettings } from '../types/backend';

const UserContext = createContext({
  user: undefined as User | null | undefined,
  backendOffline: false,
  login: () => {},
  logout: () => {},
  updateSettings: (_settings: UserSettings) => {},
});

export default UserContext;

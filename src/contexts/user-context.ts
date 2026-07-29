import { createContext } from 'react';
import { User, UserSettings } from '../types/backend';

const UserContext = createContext({
  user: undefined as User | null | undefined,
  backendOffline: false,
  login: () => {},
  logout: () => {},
  // Partial: callers patch the fields they own, see updateSettings in App.tsx
  updateSettings: (_settings: Partial<UserSettings>) => {},
});

export default UserContext;

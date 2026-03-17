import { createContext } from 'react';
import { User } from '../types/backend';

const UserContext = createContext({
  user: undefined as User | null | undefined,
  login: () => {},
  logout: () => {},
});

export default UserContext;

import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const TOKEN_KEY = 'catalogo_admin_token';

export function useAuth() {
  return useContext(AuthContext);
}

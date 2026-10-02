import { createContext, useContext } from 'react';
export const TrocasAdminContext = createContext(null);
export const useTrocasAdmin = () => useContext(TrocasAdminContext);

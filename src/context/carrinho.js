import { createContext, useContext } from 'react';

export const CarrinhoContext = createContext(null);

export function useCarrinho() {
  return useContext(CarrinhoContext);
}

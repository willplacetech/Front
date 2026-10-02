import { useReducer } from 'react';
import { CarrinhoContext } from './carrinho';
import { carrinhoReducer } from '../utils/carrinho';

export function CarrinhoProvider({ children }) {
  const [{ itens, troca }, dispatch] = useReducer(carrinhoReducer, { itens: [], troca: null });

  // ✅ ADICIONAR ITEM
  const adicionar = (produto) => {
    dispatch({ tipo: 'adicionar', produto });
  };

  // ✅ ALTERAR QUANTIDADE
  const alterarQuantidade = (id, novaQuantidade) => {
    dispatch({ tipo: 'quantidade', id, quantidade: novaQuantidade });
  };

  // ✅ REMOVER ITEM
  const remover = (id) => {
    dispatch({ tipo: 'remover', id });
  };

  const limpar = () => {
    dispatch({ tipo: 'limpar' });
  };

  return (
    <CarrinhoContext.Provider value={{ 
      itens, 
      adicionar, 
      alterarQuantidade, 
      remover, 
      limpar,
      troca: itens.length ? troca : null,
      associarTroca: troca => dispatch({ tipo: 'troca', troca })
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

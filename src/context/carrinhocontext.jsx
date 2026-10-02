import { useState } from 'react';
import { CarrinhoContext } from './carrinho';
import { adicionarAoCarrinho, alterarQuantidadeCarrinho } from '../utils/variantes';

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([]);
  const [troca, setTroca] = useState(null);

  // ✅ ADICIONAR ITEM
  const adicionar = (produto) => {
    setItens(prev => adicionarAoCarrinho(prev, produto));
  };

  // ✅ ALTERAR QUANTIDADE
  const alterarQuantidade = (id, novaQuantidade) => {
    setItens(prev => alterarQuantidadeCarrinho(prev, id, novaQuantidade));
  };

  // ✅ REMOVER ITEM
  const remover = (id) => {
    setItens(prev => prev.filter(i => i._id !== id));
  };

  const limpar = () => {
    setItens([]);
    setTroca(null);
  };

  return (
    <CarrinhoContext.Provider value={{ 
      itens, 
      adicionar, 
      alterarQuantidade, 
      remover, 
      limpar,
      troca: itens.length ? troca : null,
      associarTroca: setTroca
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

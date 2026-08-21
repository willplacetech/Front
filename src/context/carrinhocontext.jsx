import { useState } from 'react';
import { CarrinhoContext } from './carrinho';

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([]);

  // ✅ ADICIONAR ITEM
  const adicionar = (produto) => {
    setItens(prev => {
      const existe = prev.find(i => i._id === produto._id);
      if (existe) {
        return prev.map(i => 
          i._id === produto._id 
            ? { ...i, quantidade: i.quantidade + 1 } 
            : i
        );
      } else {
        return [...prev, { ...produto, quantidade: 1 }];
      }
    });
  };

  // ✅ ALTERAR QUANTIDADE
  const alterarQuantidade = (id, novaQuantidade) => {
    setItens(prev => {
      if (novaQuantidade < 1) {
        return prev.filter(i => i._id !== id);
      }
      return prev.map(i => 
        i._id === id 
          ? { ...i, quantidade: novaQuantidade } 
          : i
      );
    });
  };

  // ✅ REMOVER ITEM
  const remover = (id) => {
    setItens(prev => prev.filter(i => i._id !== id));
  };

  const limpar = () => {
    setItens([]);
  };

  return (
    <CarrinhoContext.Provider value={{ 
      itens, 
      adicionar, 
      alterarQuantidade, 
      remover, 
      limpar 
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

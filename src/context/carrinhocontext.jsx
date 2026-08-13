import { createContext, useContext, useState, useEffect } from 'react';

const CarrinhoContext = createContext();

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState(() => {
    const salvo = localStorage.getItem('carrinho');
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem('carrinho', JSON.stringify(itens));
  }, [itens]);

  const adicionar = (produto) => {
    setItens(prev => {
      const existe = prev.find(i => i._id === produto._id);
      if (existe) {
        return prev.map(i => i._id === produto._id 
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  const remover = (id) => setItens(prev => prev.filter(i => i._id !== id));
  
  const alterarQtd = (id, qtd) => {
    if (qtd <= 0) return remover(id);
    setItens(prev => prev.map(i => i._id === id ? { ...i, quantidade: qtd } : i));
  };

  const limpar = () => setItens([]);

  const total = itens.reduce((s, i) => s + ((i.precoExibicao || i.preco) * i.quantidade), 0);

  const enviarWhatsapp = (telefoneLoja, dadosCliente) => {
    let msg = `*NOVO PEDIDO*\n\n`;
    msg += `Cliente: ${dadosCliente.nome}\n`;
    msg += `Telefone: ${dadosCliente.telefone}\n`;
    if (dadosCliente.endereco) msg += `Endereço: ${dadosCliente.endereco}\n`;
    msg += `\n*ITENS:*\n`;
    itens.forEach(i => {
      const preco = i.precoExibicao || i.preco;
      msg += `▸ ${i.quantidade}x ${i.nome} - R$ ${(preco * i.quantidade).toFixed(2)}\n`;
    });
    msg += `\n*TOTAL: R$ ${total.toFixed(2)}*`;
    
    const texto = encodeURIComponent(msg);
    const numero = telefoneLoja.replace(/\D/g, '');
    return `https://wa.me/55${numero}?text=${texto}`;
  };

  return (
    <CarrinhoContext.Provider value={{ 
      itens, adicionar, remover, alterarQtd, limpar, total, enviarWhatsapp 
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export const useCarrinho = () => useContext(CarrinhoContext);
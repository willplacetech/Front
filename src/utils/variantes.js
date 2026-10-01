export const varianteDisponivel = variante => variante?.disponivel !== false &&
  (variante?.estoque === null || variante?.estoque === undefined || variante.estoque > 0);

export const moeda = valor => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ordenarCapacidades = capacidades => [...capacidades].sort((a, b) => {
  const tamanho = valor => parseFloat(valor) * (/TB/i.test(valor) ? 1024 : 1);
  return (tamanho(a) - tamanho(b)) || a.localeCompare(b, 'pt-BR', { numeric: true });
});

export function itemDaVariante(produto, variante) {
  return {
    // A chave do carrinho continua sendo _id, agora única para modelo + variante.
    _id: `${produto._id}:${variante._id}`,
    produtoId: produto._id,
    variantId: variante._id,
    sku: variante.sku,
    cor: variante.cor,
    capacidade: variante.capacidade,
    estoque: variante.estoque,
    disponivel: variante.disponivel,
    nome: [produto.nome, variante.cor !== 'Padrão' ? variante.cor : '', variante.capacidade !== 'Padrão' ? variante.capacidade : ''].filter(Boolean).join(' '),
    preco: variante.preco,
    precoPersonalizado: variante.preco,
    imagem: variante.imagens?.[0] || produto.imagem || ''
  };
}

export function adicionarAoCarrinho(itens, produto) {
  const existente = itens.find(item => item._id === produto._id);
  const quantidade = (existente?.quantidade || 0) + 1;
  if (produto.disponivel === false || (produto.estoque !== null && produto.estoque !== undefined && quantidade > produto.estoque)) return itens;
  return existente ? itens.map(item => item._id === produto._id ? { ...produto, quantidade } : item)
    : [...itens, { ...produto, quantidade: 1 }];
}

export function alterarQuantidadeCarrinho(itens, id, quantidade) {
  if (!Number.isInteger(quantidade)) return itens;
  if (quantidade < 1) return itens.filter(item => item._id !== id);
  return itens.map(item => item._id === id ? {
    ...item, quantidade: item.estoque === null || item.estoque === undefined ? quantidade : Math.min(quantidade, item.estoque)
  } : item);
}

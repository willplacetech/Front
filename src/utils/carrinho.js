import { adicionarAoCarrinho, alterarQuantidadeCarrinho } from './variantes.js';

export function carrinhoReducer(estado, acao) {
  if (acao.tipo === 'limpar') return { itens: [], troca: null };
  if (acao.tipo === 'troca') return { ...estado, troca: acao.troca };
  const itens = acao.tipo === 'adicionar' ? adicionarAoCarrinho(estado.itens, acao.produto)
    : acao.tipo === 'quantidade' ? alterarQuantidadeCarrinho(estado.itens, acao.id, acao.quantidade)
      : acao.tipo === 'remover' ? estado.itens.filter(item => item._id !== acao.id) : estado.itens;
  return { itens, troca: itens.length ? estado.troca : null };
}

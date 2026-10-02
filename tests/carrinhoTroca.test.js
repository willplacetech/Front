import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carrinhoReducer } from '../src/utils/carrinho.js';

test('esvaziar carrinho remove associação da troca e não a recupera ao adicionar outro item', () => {
  const inicial = { itens: [{ _id: 'a', quantidade: 1, preco: 100 }], troca: { _id: 'troca', valorOferta: 80, status: 'aprovado' } };
  for (const acao of [{ tipo: 'quantidade', id: 'a', quantidade: 0 }, { tipo: 'remover', id: 'a' }, { tipo: 'limpar' }]) {
    const vazio = carrinhoReducer(inicial, acao);
    assert.equal(vazio.troca, null);
    const novo = carrinhoReducer(vazio, { tipo: 'adicionar', produto: { _id: 'b', preco: 200 } });
    assert.equal(novo.troca, null);
    assert.equal(novo.itens[0]._id, 'b');
  }
});

test('troca é preservada ao editar um carrinho que ainda tem itens', () => {
  const inicial = { itens: [{ _id: 'a', quantidade: 1 }, { _id: 'b', quantidade: 1 }], troca: { _id: 'troca' } };
  assert.equal(carrinhoReducer(inicial, { tipo: 'remover', id: 'a' }).troca._id, 'troca');
  assert.equal(carrinhoReducer(inicial, { tipo: 'quantidade', id: 'a', quantidade: 2 }).troca._id, 'troca');
});

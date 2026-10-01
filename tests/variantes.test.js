import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adicionarAoCarrinho, alterarQuantidadeCarrinho, itemDaVariante, ordenarCapacidades } from '../src/utils/variantes.js';

test('variantes diferentes do mesmo modelo têm itens, preços e SKUs separados', () => {
  const produto = { _id: 'modelo', nome: 'iPhone 17 Pro Max' };
  const prata = itemDaVariante(produto, { _id: 'prata256', cor: 'Prata', capacidade: '256GB', preco: 7500, sku: 'PRATA256', estoque: null });
  const azul = itemDaVariante(produto, { _id: 'azul512', cor: 'Deep Blue', capacidade: '512GB', preco: 8100, sku: 'AZUL512', estoque: null });
  let itens = adicionarAoCarrinho([], prata);
  itens = adicionarAoCarrinho(itens, azul);
  itens = adicionarAoCarrinho(itens, prata);
  assert.equal(itens.length, 2);
  assert.equal(itens[0].quantidade, 2);
  assert.equal(itens[1].preco, 8100);
  assert.equal(itens[1].sku, 'AZUL512');
  assert.equal(itens[1].produtoId, 'modelo');
  assert.equal(itens[1].variantId, 'azul512');
  assert.equal(alterarQuantidadeCarrinho(itens, prata._id, 100)[0].quantidade, 100);
  assert.equal(alterarQuantidadeCarrinho(itens, prata._id, 0).length, 1);
});

test('estoque físico limita adição e quantidade; carrinho legado continua aceito', () => {
  const legado = { _id: 'legado', nome: 'Antigo', preco: 100 };
  assert.equal(adicionarAoCarrinho([], legado)[0].quantidade, 1);
  const variante = { _id: 'v', estoque: 1, preco: 120 };
  const itens = adicionarAoCarrinho([], variante);
  assert.equal(adicionarAoCarrinho(itens, variante)[0].quantidade, 1);
  assert.equal(alterarQuantidadeCarrinho(itens, 'v', 9)[0].quantidade, 1);
  assert.deepEqual(adicionarAoCarrinho([], { _id: 'zero', estoque: 0 }), []);
  assert.deepEqual(ordenarCapacidades(['1TB', '256GB', '128GB', '512GB']), ['128GB', '256GB', '512GB', '1TB']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dadosParaEnvio, FOTOS_TROCA, LIMITE_FOTO, modelosDoCatalogo, opcoesDoModelo, validarConteudoFoto, validarFoto, validarImei } from '../src/utils/troca.js';

test('fotos: exige arquivo, tipo suportado, conteúdo coerente e limite de 5 MB', async () => {
  assert.notEqual(validarFoto(null), true);
  assert.notEqual(validarFoto({ type: 'image/heic', size: 10 }), true);
  assert.notEqual(validarFoto({ type: 'image/jpeg', size: 0 }), true);
  assert.notEqual(validarFoto({ type: 'image/jpeg', size: LIMITE_FOTO + 1 }), true);
  assert.equal(validarFoto({ type: 'image/jpeg', size: LIMITE_FOTO }), true);
  for (const [type, bytes] of [
    ['image/jpeg', [255, 216, 255]],
    ['image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['image/webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]]
  ]) assert.equal(await validarConteudoFoto(new File([new Uint8Array(bytes)], 'foto', { type })), true);
  assert.notEqual(await validarConteudoFoto(new File(['não é uma imagem'], 'foto.png', { type: 'image/png' })), true);
});

test('IMEI: exige 15 dígitos e o mesmo dígito verificador aceito pelo backend', () => {
  assert.equal(validarImei('490154203237518'), true);
  assert.equal(validarImei('356938035643809'), true);
  for (const valor of ['', '49015420323751', '4901542032375180', '49015420323751x', '490154203237519']) assert.notEqual(validarImei(valor), true);
});

test('modelos usam o catálogo e não misturam cores entre capacidades', () => {
  const lista = modelosDoCatalogo([
    { nome: 'iPhone 15', variants: [{ capacidade: '1TB', cor: 'Preto' }, { capacidade: '128GB', cor: 'Azul' }] },
    { nome: 'iPhone 15', variants: [{ capacidade: '256GB', cor: 'Rosa' }, { capacidade: '128GB', cor: 'Azul' }] },
    { nome: 'iPhone 14', variants: [{ capacidade: '128GB', cor: 'Branco' }] }
  ]);
  assert.deepEqual(lista.map(item => item.nome), ['iPhone 14', 'iPhone 15']);
  assert.deepEqual(opcoesDoModelo(lista[1], '128GB'), { capacidades: ['128GB', '256GB', '1TB'], cores: ['Azul'] });
  assert.deepEqual(opcoesDoModelo(null), { capacidades: [], cores: [] });
});

test('envio usa multipart com as seis chaves da API e os dados de contato', () => {
  const fotos = Object.fromEntries(FOTOS_TROCA.map(({ campo }) => [campo, new File(['foto'], `${campo}.png`, { type: 'image/png' })]));
  const payload = dadosParaEnvio({ modeloAparelho: 'iPhone 15', capacidade: '128GB', cor: 'Azul', imei: '490154203237518',
    descricaoEstado: ' Bom estado ', nome: ' Cliente ', email: 'cliente@example.com', telefone: '11999999999', fotos });
  assert.equal(payload.get('nome'), 'Cliente');
  assert.equal(payload.get('descricaoEstado'), 'Bom estado');
  assert.equal(payload.get('imei'), '490154203237518');
  for (const { campo } of FOTOS_TROCA) {
    assert.equal(payload.get(campo).name, `${campo}.png`);
    assert.equal(payload.get(campo).type, 'image/png');
  }
  assert.equal([...payload.keys()].length, 14);
});

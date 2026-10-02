import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

const ID = '012345678901234567890123';
const produtos = ['iPhone 14', 'iPhone 15', 'iPhone 16', 'iPhone 17'].map((nome, i) => ({
  _id: `p${i}`, nome, marca: 'Apple', categoria: 'Lacrado', disponivel: true, precoAPartir: 3000 + i * 1000,
  cores: ['Azul', 'Preto', 'Rosa'], capacidades: ['128GB', '256GB', '512GB'],
  specs: { tela: '6,1 polegadas', chip: `A${15 + i}`, camera: i ? '48 MP' : '12 MP', bateria: `${20 + i * 2} horas`, '5g': true },
  variants: [
    { _id: `v${i}a`, cor: 'Azul', capacidade: '128GB', preco: 3000 + i * 1000, estoque: null, sku: `IP${i}A`, imagens: [] },
    { _id: `v${i}b`, cor: 'Preto', capacidade: '256GB', preco: 3500 + i * 1000, estoque: 2, sku: `IP${i}B`, imagens: [] },
    { _id: `v${i}z`, cor: 'Rosa', capacidade: '512GB', preco: 4500 + i * 1000, estoque: 0, sku: `IP${i}Z`, imagens: [] }
  ]
}));
async function preparar(page, { oferta = 1500, falhaTroca = false, logado = false } = {}) {
  const pedidos = [];
  await page.addInitScript(id => {
    sessionStorage.setItem(`troca:${id}`, 'segredo');
    sessionStorage.setItem('troca:ultima', id);
  }, ID);
  if (logado) await page.addInitScript(() => localStorage.setItem('catalogo_admin_token', 'token-cliente'));
  await page.route('**/api/**', async route => {
    const caminho = new URL(route.request().url()).pathname;
    if (caminho === '/api/produtos') return route.fulfill({ json: produtos });
    if (caminho.startsWith('/api/produtos/')) return route.fulfill({ json: produtos.find(p => caminho.endsWith(p._id)) });
    if (caminho === '/api/filtros') return route.fulfill({ json: {} });
    if (caminho === '/api/auth/me') return route.fulfill({ json: { user: { nome: 'Cliente', email: 'cliente@example.com', telefone: '11999999999' } } });
    if (caminho === '/api/troca/configuracoes') return route.fulfill({ json: { checklist: [] } });
    if (caminho === '/api/troca/mid') return route.fulfill({ json: [{ _id: ID, modeloAparelho: 'iPhone 14', cor: 'Azul', capacidade: '128GB', status: 'aprovado', valorOferta: 1500 }] });
    if (caminho === '/api/troca') return route.fulfill({ status: 201, json: { sucesso: true, id: ID, protocolo: ID, status: 'pendente', acessoToken: 'segredo' } });
    if (caminho === `/api/troca/${ID}`) return route.fulfill({ status: falhaTroca ? 404 : 200, json: falhaTroca ? { error: 'Solicitação não encontrada' } : {
      _id: ID, modeloAparelho: 'iPhone 14', cor: 'Azul', capacidade: '128GB', descricaoEstado: 'Tela sem riscos',
      status: oferta === null ? 'pendente' : 'aprovado', valorOferta: oferta, fotos: {}
    } });
    if (caminho === '/api/pedidos') {
      pedidos.push({ body: route.request().postDataJSON(), token: route.request().headers()['x-troca-token'] });
      return route.fulfill({ status: 400, json: { error: 'Pedido capturado para teste' } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  return pedidos;
}

test('troca recuperada, limite de dois, variantes, histórico, deep link e pedido associado', async ({ page }) => {
  const pedidos = await preparar(page);
  await page.goto('/comparar');
  await expect(page.getByRole('heading', { name: 'Seu aparelho', exact: true })).toBeVisible();
  await expect(page.getByText('Tela sem riscos', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Avançar', exact: true }).click();
  await expect(page).toHaveURL(/passo=loja/);
  await page.getByRole('button', { name: 'Selecionar iPhone 15', exact: true }).click();
  const seletor = page.getByRole('region', { name: 'Seleção de iPhone 15' });
  await expect(seletor.getByRole('button', { name: 'Rosa', exact: true })).toBeDisabled();
  await seletor.getByRole('button', { name: 'Preto', exact: true }).click();
  await expect(seletor.getByRole('button', { name: '256GB', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Selecionar iPhone 16', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Selecionar iPhone 17', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Avançar', exact: true }).click();
  await expect(page).toHaveURL(/passo=comparativo/);
  await expect(page.locator('.comparar-card')).toHaveCount(3);
  const card = page.getByRole('article', { name: 'iPhone 15' });
  await expect(card).toContainText('256GB');
  await expect(card).toContainText('R$ 3.000,00');
  await expect(card.locator('.comparar-diferenca')).not.toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('comparativo.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.reload();
  await expect(card).toContainText('256GB');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page).toHaveURL(/passo=loja/);
  await page.goBack();
  await expect(page).toHaveURL(/passo=comparativo/);
  await card.getByRole('button', { name: 'Quero este com a troca', exact: true }).click();
  await expect(page).toHaveURL(/\/carrinho/);
  await page.getByPlaceholder('Seu nome completo').fill('Cliente');
  await page.getByPlaceholder('Telefone com DDD').fill('11999999999');
  page.on('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: /Enviar via WhatsApp/ }).click();
  await expect.poll(() => pedidos.length).toBe(1);
  expect(pedidos[0].body.tradeInId).toBe(ID);
  expect(pedidos[0].body.itens[0].variantId).toBe('v1b');
  expect(pedidos[0].token).toBe('segredo');
});

test('sem oferta mostra avaliação; troca inacessível bloqueia uso do crédito', async ({ page }) => {
  await preparar(page, { oferta: null });
  await page.goto(`/comparar?passo=comparativo&tradeInId=${ID}&item=p1:v1a`);
  await expect(page.getByRole('article', { name: 'iPhone 15' })).toContainText('Em avaliação');
  await expect(page.getByRole('article', { name: 'iPhone 15' })).toContainText('R$ 4.000,00');
  await page.unroute('**/api/**');
  await preparar(page, { falhaTroca: true });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Solicitação não encontrada');
  await expect(page.getByRole('button', { name: 'Quero este com a troca' })).toHaveCount(0);
});

test('seleção na hora permite comparar e retorna ao cadastro sem perder variantes', async ({ page }) => {
  await preparar(page, { oferta: null });
  await page.goto('/comparar?passo=comparativo&meu=p0&variante=v0a&estado=Sem%20riscos&item=p2:v2b');
  await expect(page.getByRole('article', { name: 'iPhone 16' })).toBeVisible();
  await page.getByRole('button', { name: 'Quero este com a troca' }).click();
  await expect(page).toHaveURL(/\/troca\?/);
  await expect(page.locator('#modeloAparelho')).toHaveValue('iPhone 14');
  await expect(page.locator('#capacidade')).toHaveValue('128GB');
  await expect(page.locator('#cor')).toHaveValue('Azul');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  const arquivo = { name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') };
  for (const campo of ['frontal', 'traseira', 'superior', 'inferior', 'lateralEsq', 'lateralDir']) await page.locator(`#foto-${campo}`).setInputFiles(arquivo);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('#descricaoEstado')).toHaveValue('Sem riscos');
  await page.locator('#imei').fill('490154203237518');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('#nome').fill('Cliente teste');
  await page.locator('#email').fill('cliente@example.com');
  await page.locator('#telefone').fill('11999999999');
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await page.getByRole('link', { name: 'Continuar minha comparação' }).click();
  await expect(page).toHaveURL(/passo=comparativo/);
  const card = page.getByRole('article', { name: 'iPhone 16' });
  await expect(card).toContainText('256GB');
  await expect(card).toContainText('Em avaliação');
  await card.getByRole('button', { name: 'Quero este com a troca' }).click();
  await expect(page).toHaveURL(/\/carrinho/);
  await expect(page.getByRole('dialog', { name: 'Seu carrinho' })).toContainText('Troca associada: iPhone 14');
});

test('deep link incompleto volta ao primeiro passo e catálogo oferece comparação', async ({ page }) => {
  await preparar(page);
  await page.goto('/comparar?passo=comparativo&meu=inexistente&item=p2:inexistente');
  await expect(page.getByRole('heading', { name: 'Seu aparelho', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Avançar', exact: true })).toBeDisabled();
  await page.goto('/');
  await page.getByRole('link', { name: 'Comparar aparelhos', exact: true }).first().click();
  await expect(page).toHaveURL(/\/comparar/);
});

test('perfil de cliente sem ID no contato recupera suas trocas pelo token', async ({ page }) => {
  await preparar(page, { logado: true });
  await page.goto('/comparar');
  await expect(page.getByLabel('Troca cadastrada')).toBeVisible();
  await expect(page.getByLabel('Troca cadastrada')).toHaveValue(ID);
  await page.getByLabel('Troca cadastrada').selectOption('');
  await expect(page.getByLabel('Modelo do seu aparelho')).toBeVisible();
  await page.getByLabel('Modelo do seu aparelho').selectOption('p0');
  await page.getByLabel('Estado descrito').fill('Sem riscos');
  await page.getByRole('button', { name: 'Avançar', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar iPhone 16', exact: true }).click();
  await page.getByRole('button', { name: 'Avançar', exact: true }).click();
  await expect(page.getByRole('article', { name: 'iPhone 14' })).toContainText('Sem riscos');
});

test('detalhe de produto compartilha seletor e leva a variante escolhida à comparação', async ({ page }) => {
  await preparar(page);
  await page.goto('/produto/p1');
  const seletor = page.getByRole('region', { name: 'Seleção de iPhone 15' });
  await seletor.getByRole('button', { name: 'Preto', exact: true }).click();
  await expect(page.locator('.variant-price')).toContainText('R$ 4.500,00');
  await page.getByRole('link', { name: 'Comparar este aparelho', exact: true }).click();
  await page.getByRole('button', { name: 'Avançar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Seleção de iPhone 15' }).getByRole('button', { name: '256GB', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

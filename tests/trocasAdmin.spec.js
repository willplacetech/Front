import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
const ID = '012345678901234567890123';
const FOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');

async function preparar(page, { admin = true, autenticado = true } = {}) {
  let troca = { _id: ID, nome: 'Cliente teste', email: 'cliente@example.com', telefone: '11999999999',
    modeloAparelho: 'iPhone 15', cor: 'Azul', capacidade: '128GB', imei: '490154203237518', descricaoEstado: 'Tela sem riscos',
    createdAt: '2026-10-02T10:00:00Z', status: 'pendente', valorOferta: null, motivoRejeicao: '',
    fotos: Object.fromEntries(['frontal', 'superior', 'inferior', 'lateralEsq', 'lateralDir'].map(c => [c, `https://fotos.test/${c}.png`])),
    historico: [{ status: 'pendente', data: '2026-10-02T10:00:00Z' }] };
  const alteracoes = [];
  if (autenticado) await page.addInitScript(() => localStorage.setItem('catalogo_admin_token', 'token-teste'));
  await page.route('https://fotos.test/**', r => r.fulfill({ contentType: 'image/png', body: FOTO }));
  await page.route('**/api/**', async route => {
    const caminho = new URL(route.request().url()).pathname;
    if (caminho === '/api/auth/me') return route.fulfill({ json: { user: admin ? null : { nome: 'Cliente teste', email: 'cliente@example.com', telefone: '11999999999' } } });
    if (caminho === '/api/auth/admin') return route.fulfill({ status: admin ? 200 : 403, json: admin ? { admin: true } : { error: 'Acesso exclusivo de administrador' } });
    if (caminho === `/api/troca/${ID}/status`) {
      const body = route.request().postDataJSON(); alteracoes.push(body);
      troca = { ...troca, ...body, valorOferta: body.status === 'aprovado' ? body.valorOferta : null,
        historico: [...troca.historico, { ...body, data: '2026-10-02T11:00:00Z' }] };
      return route.fulfill({ json: { sucesso: true, solicitacao: troca } });
    }
    if (caminho === '/api/troca/admin/exportar') return route.fulfill({ body: '\ufeffProtocolo;Nome\r\n' + ID + ';Cliente teste', contentType: 'text/csv; charset=utf-8' });
    if (caminho === '/api/troca/admin' || caminho === '/api/troca/mid') return route.fulfill({ json: [troca] });
    if (caminho === `/api/troca/admin/${ID}` || caminho === `/api/troca/${ID}`) return route.fulfill({ json: troca });
    return route.fulfill({ status: 404, json: {} });
  });
  return alteracoes;
}

test('admin vê contador, galeria com zoom, muda status e exporta filtro', async ({ page }) => {
  const alteracoes = await preparar(page);
  await page.goto('/loja/trocas');
  await expect(page.getByRole('heading', { name: 'Solicitações de troca' })).toBeVisible();
  if (test.info().project.name === 'mobile') await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('link', { name: /Trocas \(1\)/ }).filter({ visible: true })).toBeVisible();
  if (test.info().project.name === 'mobile') await page.getByRole('link', { name: /Trocas \(1\)/ }).filter({ visible: true }).click();
  await page.getByRole('link', { name: `Abrir troca ${ID}` }).click();
  await expect(page.locator('.trocas-galeria img')).toHaveCount(5);
  await page.getByRole('button', { name: 'Ampliar Frente (tela)' }).click();
  await expect(page.getByRole('dialog', { name: 'Foto ampliada' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mover para Em avaliação' }).click();
  await expect(page.getByRole('status')).toContainText('Em avaliação');
  await page.getByRole('button', { name: 'Aprovar troca' }).click();
  expect(alteracoes).toHaveLength(1);
  await page.getByLabel('Valor da oferta (R$)').fill('1500.25');
  await page.getByRole('button', { name: 'Aprovar troca' }).click();
  await expect(page.getByRole('status')).toContainText('Aprovado');
  expect(alteracoes.at(-1)).toEqual({ status: 'aprovado', valorOferta: 1500.25 });
  await page.getByRole('link', { name: 'Voltar às trocas' }).click();
  await page.getByLabel('Filtrar por status').selectOption('aprovado');
  await expect(page.getByRole('link', { name: `Abrir troca ${ID}` })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/trocas.*\.csv/);
  await page.goto('/troca/mid');
  // Visitantes podem acompanhar a solicitação pelo protocolo e chave desta sessão.
  await page.evaluate(id => sessionStorage.setItem(`troca:${id}`, 'segredo'), ID);
  await page.getByLabel('Protocolo da troca').fill(ID);
  await page.getByRole('button', { name: 'Consultar troca' }).click();
  await expect(page.locator('.troca-timeline')).toContainText('Aprovado');
  await expect(page.locator('.troca-timeline li')).toHaveCount(3);
  await page.screenshot({ path: test.info().outputPath('acompanhamento.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('.troca-timeline')).toContainText('Aprovado');
});

test('motivo obrigatório e cliente recebe rejeição na sua linha do tempo', async ({ page }) => {
  const alteracoes = await preparar(page);
  await page.goto(`/loja/trocas/${ID}`);
  await page.getByRole('button', { name: 'Rejeitar troca' }).click();
  expect(alteracoes).toHaveLength(0);
  await page.getByLabel('Motivo da rejeição').fill('Tela danificada');
  await page.getByRole('button', { name: 'Rejeitar troca' }).click();
  await expect(page.getByRole('status')).toContainText('Rejeitado');
  await page.route('**/api/auth/me', r => r.fulfill({ json: { user: { nome: 'Cliente teste', email: 'cliente@example.com', telefone: '11999999999' } } }));
  await page.goto('/troca/mid');
  await expect(page.getByText('Tela danificada', { exact: true })).toBeVisible();
});

test('rota admin exige sessão verificada e não permite perfil de cliente', async ({ page }) => {
  await preparar(page, { autenticado: false });
  await page.goto('/loja/trocas');
  await expect(page.getByRole('heading', { name: 'Área administrativa' })).toBeVisible();
  await page.unroute('**/api/**');
  await preparar(page, { admin: false });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Acesso exclusivo de administrador');
  await expect(page.getByRole('heading', { name: 'Solicitações de troca' })).toHaveCount(0);
});

test('cliente logado ainda acompanha protocolo de visitante autorizado nesta sessão', async ({ page }) => {
  await preparar(page, { admin: false });
  await page.addInitScript(id => sessionStorage.setItem(`troca:${id}`, 'segredo'), ID);
  await page.route('**/api/troca/mid', route => route.fulfill({ json: [{
    _id: '112345678901234567890123', modeloAparelho: 'Outra solicitação', status: 'pendente', historico: [],
    createdAt: '2026-10-02T10:00:00Z'
  }] }));
  await page.goto(`/troca/mid?protocolo=${ID}`);
  await expect(page.getByText(`PROTOCOLO ${ID}`, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Outra solicitação' })).toHaveCount(0);
});

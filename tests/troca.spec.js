import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

const CAMPOS = ['frontal', 'superior', 'inferior', 'lateralEsq', 'lateralDir'];
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const ARQUIVO = { name: 'aparelho.png', mimeType: 'image/png', buffer: PNG };
const PRODUTOS = [{ _id: 'iphone15', nome: 'iPhone 15', marca: 'Apple', categoria: 'iPhones Lacrados', precoAPartir: 3500, cores: ['Azul', 'Preto'], capacidades: ['128GB', '256GB'], variants: [
  { capacidade: '128GB', cor: 'Azul' }, { capacidade: '256GB', cor: 'Preto' }
] }, { _id: 'iphone14', nome: 'iPhone 14', marca: 'Apple', categoria: 'iPhones Lacrados', precoAPartir: 2500, cores: ['Branco'], capacidades: ['128GB'], variants: [{ capacidade: '128GB', cor: 'Branco' }] }];

async function preparar(page, { user = null, falhaEnvio = 0 } = {}) {
  const enviados = [];
  if (user) await page.addInitScript(() => localStorage.setItem('catalogo_admin_token', 'token-de-teste'));
  await page.route('**/api/**', async route => {
    const caminho = new URL(route.request().url()).pathname;
    if (caminho === '/api/produtos') return route.fulfill({ json: PRODUTOS });
    if (caminho === '/api/filtros') return route.fulfill({ json: { modelos: ['iPhone 15', 'iPhone 14'] } });
    if (caminho === '/api/auth/me') return route.fulfill({ json: { user } });
    if (caminho === '/api/troca') {
      enviados.push(route.request().postDataBuffer().toString());
      return falhaEnvio ? route.fulfill({ status: falhaEnvio, json: { error: falhaEnvio === 409 ? 'Já existe uma solicitação para este IMEI' : 'Não foi possível processar as fotos. Tente novamente.' } })
        : route.fulfill({ status: 201, json: { sucesso: true, id: '012345678901234567890123', protocolo: '012345678901234567890123', status: 'pendente', acessoToken: 'acesso-visitante' } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/troca');
  await expect(page.getByText('Carregando modelos do catálogo…')).toBeHidden();
  return enviados;
}

async function aparelho(page) {
  await page.locator('#modeloAparelho').fill('iPhone 15');
  await page.locator('#capacidade').selectOption('128GB');
  await page.locator('#cor').selectOption('Azul');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Passo 2 de 4')).toBeVisible();
}

async function fotos(page) {
  for (const campo of CAMPOS) await page.locator(`#foto-${campo}`).setInputFiles(ARQUIVO);
  await expect(page.getByText('5 de 5 fotos adicionadas')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Passo 3 de 4')).toBeVisible();
}

async function confirmar(page) {
  await page.locator('#descricaoEstado').fill('Tela sem riscos. Bateria com 87%. Acompanha caixa.');
  await page.locator('#imei').fill('490154203237518');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Passo 4 de 4')).toBeVisible();
}

async function contato(page) {
  await page.locator('#nome').fill('Cliente Placetech');
  await page.locator('#email').fill('cliente@example.com');
  await page.locator('#telefone').fill('(11) 99999-9999');
}

test('visitante percorre os quatro passos, revisa, envia cinco arquivos e recebe protocolo real', async ({ page }) => {
  const enviados = await preparar(page);
  const erros = [];
  page.on('pageerror', error => erros.push(error.message));
  await page.screenshot({ path: test.info().outputPath('troca-aparelho.png'), fullPage: true });
  await aparelho(page);
  await page.screenshot({ path: test.info().outputPath('troca-fotos.png'), fullPage: true });
  await fotos(page);
  await confirmar(page);
  await page.screenshot({ path: test.info().outputPath('troca-confirmacao.png'), fullPage: true });
  await expect(page.getByRole('definition').filter({ hasText: '490154203237518' })).toBeVisible();
  await expect(page.locator('.troca-summary-photos img')).toHaveCount(5);
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await expect(page.getByText('Informe seu nome.', { exact: true })).toBeVisible();
  expect(enviados).toHaveLength(0);
  await contato(page);
  await page.locator('#email').fill('email-invalido');
  await page.locator('#telefone').fill('123');
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await expect(page.getByText('Informe um email válido.')).toBeVisible();
  await expect(page.getByText('Informe um telefone válido com DDD.')).toBeVisible();
  expect(enviados).toHaveLength(0);
  await contato(page);
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await expect(page.getByText('Sua troca está', { exact: false })).toContainText('PENDENTE — entraremos em contato em até 24h.');
  await expect(page.getByText('012345678901234567890123', { exact: true })).toBeVisible();
  expect(enviados).toHaveLength(1);
  for (const campo of [...CAMPOS, 'imei', 'modeloAparelho', 'capacidade', 'cor', 'nome', 'email', 'telefone', 'descricaoEstado']) expect(enviados[0]).toContain(`name="${campo}"`);
  expect(enviados[0]).toContain('cliente@example.com');
  expect(await page.evaluate(() => sessionStorage.getItem('troca:012345678901234567890123'))).toBe('acesso-visitante');
  expect(erros).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('bloqueia modelo fora do catálogo, campos vazios, foto ausente e IMEI inválido', async ({ page }) => {
  await preparar(page);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Passo 1 de 4')).toBeVisible();
  await expect(page.getByText('Selecione o modelo do seu aparelho.')).toBeVisible();
  await page.locator('#modeloAparelho').fill('Modelo inexistente');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Selecione um modelo da lista do catálogo.')).toBeVisible();
  await aparelho(page);
  for (const campo of CAMPOS.slice(0, 4)) await page.locator(`#foto-${campo}`).setInputFiles(ARQUIVO);
  await expect(page.getByText('4 de 5 fotos adicionadas')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Passo 2 de 4')).toBeVisible();
  await expect(page.getByText('Adicione uma foto deste ângulo.', { exact: true })).toBeVisible();
  await page.locator('#foto-lateralDir').setInputFiles(ARQUIVO);
  await expect(page.getByText('5 de 5 fotos adicionadas')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Passo 3 de 4')).toBeVisible();
  await expect(page.locator('.troca-imei-tip')).toContainText('Como obter o IMEI: abra o app Telefone, digite *#06# no teclado e ligue. O número aparecerá na tela.');
  for (const valor of ['', '123', '49015420323751x', '490154203237519']) {
    await page.locator('#imei').fill(valor);
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(page.getByText('Passo 3 de 4')).toBeVisible();
    await expect(page.locator('#imei-error')).toBeVisible();
  }
});

test('valida tipo, tamanho e assinatura; permite arrastar, substituir e remover fotos', async ({ page }) => {
  await preparar(page);
  await aparelho(page);
  await page.locator('#foto-frontal').setInputFiles({ name: 'arquivo.txt', mimeType: 'text/plain', buffer: Buffer.from('texto') });
  await expect(page.getByText('Use uma imagem JPEG, PNG ou WebP.')).toBeVisible();
  await page.locator('#foto-frontal').setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByText('Cada foto deve ter no máximo 5 MB.')).toBeVisible();
  await page.locator('#foto-frontal').setInputFiles({ name: 'falsa.png', mimeType: 'image/png', buffer: Buffer.from('texto') });
  await expect(page.getByText('O conteúdo da foto não corresponde ao formato. Escolha outra imagem.')).toBeVisible();
  const transferencia = await page.evaluateHandle(bytes => {
    const dados = new DataTransfer();
    dados.items.add(new File([new Uint8Array(bytes)], 'arrastada.png', { type: 'image/png' }));
    return dados;
  }, [...PNG]);
  await page.locator('label[for="foto-frontal"]').dispatchEvent('drop', { dataTransfer: transferencia });
  await expect(page.getByText('1 de 5 fotos adicionadas')).toBeVisible();
  await expect(page.locator('.troca-photo-slot').first().locator('img')).toHaveAttribute('src', /^blob:/);
  await page.locator('#foto-frontal').setInputFiles(ARQUIVO);
  await expect(page.locator('.troca-file-detail').first()).toContainText('aparelho.png');
  await page.getByRole('button', { name: 'Remover foto: Frente (tela)' }).click();
  await expect(page.getByText('0 de 5 fotos adicionadas')).toBeVisible();
});

test('voltar preserva dados e mudar modelo limpa capacidade e cor dependentes', async ({ page }) => {
  await preparar(page);
  await aparelho(page);
  await fotos(page);
  await confirmar(page);
  await page.getByRole('button', { name: 'Editar fotos', exact: true }).click();
  await expect(page.getByText('5 de 5 fotos adicionadas')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.locator('#imei')).toHaveValue('490154203237518');
  await expect(page.locator('#descricaoEstado')).toHaveValue('Tela sem riscos. Bateria com 87%. Acompanha caixa.');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.locator('#modeloAparelho')).toHaveValue('iPhone 15');
  await page.locator('#modeloAparelho').fill('iPhone 14');
  await expect(page.locator('#capacidade')).toHaveValue('');
  await expect(page.locator('#cor')).toHaveValue('');
  await page.locator('#capacidade').selectOption('128GB');
  await expect(page.locator('#cor option')).toHaveText(['Selecione a cor', 'Branco']);
});

test('perfil autenticado pré-preenche nome, email e telefone', async ({ page }) => {
  await preparar(page, { user: { nome: 'Cliente logado', email: 'logado@example.com', telefone: '21999999999' } });
  await aparelho(page);
  await fotos(page);
  await confirmar(page);
  await expect(page.locator('#nome')).toHaveValue('Cliente logado');
  await expect(page.locator('#email')).toHaveValue('logado@example.com');
  await expect(page.locator('#telefone')).toHaveValue('21999999999');
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await expect(page.getByRole('heading', { name: 'Agora é com a Placetech.' })).toBeVisible();
});

test('falha no envio preserva revisão e não exibe sucesso', async ({ page }) => {
  await preparar(page, { falhaEnvio: 503 });
  await aparelho(page);
  await fotos(page);
  await confirmar(page);
  await contato(page);
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await expect(page.getByText('Não foi possível processar as fotos. Tente novamente.')).toBeVisible();
  await expect(page.getByText('Passo 4 de 4')).toBeVisible();
  await expect(page.locator('.troca-summary-photos img')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Agora é com a Placetech.' })).toBeHidden();
});

test('IMEI duplicado volta ao passo correto com erro da API', async ({ page }) => {
  await preparar(page, { falhaEnvio: 409 });
  await aparelho(page);
  await fotos(page);
  await confirmar(page);
  await contato(page);
  await page.getByRole('button', { name: 'Enviar para avaliação' }).click();
  await expect(page.getByText('Passo 3 de 4')).toBeVisible();
  await expect(page.locator('#imei-error')).toHaveText('Já existe uma solicitação para este IMEI');
});

test('nav e hero levam ao wizard', async ({ page }) => {
  await preparar(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Trocar meu aparelho', exact: true })).toHaveCount(2);
  const nav = page.locator('.nav-troca');
  await expect(nav).toBeVisible();
  await nav.click();
  await expect(page).toHaveURL(/\/troca$/);
  await expect(page.getByText('Passo 1 de 4')).toBeVisible();
});

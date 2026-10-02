export const PASSOS_COMPARAR = ['aparelho', 'loja', 'comparativo'];
export const SPECS_COMPARAR = [['tela', 'Tela'], ['chip', 'Chip'], ['camera', 'Câmera'], ['bateria', 'Bateria'], ['5g', '5G']];

export function creditoDaTroca(troca) {
  return troca?.status === 'aprovado' && typeof troca.valorOferta === 'number' && Number.isFinite(troca.valorOferta)
    ? Math.max(0, troca.valorOferta) : null;
}

export const valorFinal = (preco, credito) => Math.max(0, Number(preco) - (credito ?? 0));

export function specDoProduto(produto, campo) {
  const valor = produto?.specs?.[campo] ?? (campo === 'camera' ? produto?.specs?.['câmera'] : null);
  if (campo === '5g' && typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  return valor === null || valor === undefined || String(valor).trim() === '' ? '' : String(valor).trim();
}

const normalizar = valor => String(valor).trim().toLocaleLowerCase('pt-BR');
export function camposDiferentes(aparelhos) {
  return new Set(['capacidade', 'cor', ...SPECS_COMPARAR.map(([campo]) => campo)].filter(campo => {
    const valores = aparelhos.map(aparelho => campo === 'cor' || campo === 'capacidade'
      ? aparelho[campo] : specDoProduto(aparelho.produto, campo)).filter(Boolean).map(normalizar);
    return new Set(valores).size > 1;
  }));
}

// Mede diferenças observáveis; não infere desempenho de nomes de chips ou câmeras.
export function diferencaDeUpgrade(atual, proximo) {
  const pares = [['capacidade', atual.capacidade, proximo.capacidade], ...SPECS_COMPARAR.map(([campo]) =>
    [campo, specDoProduto(atual.produto, campo), specDoProduto(proximo.produto, campo)])];
  const conhecidos = pares.filter(([, a, b]) => a && b);
  const diferentes = conhecidos.filter(([, a, b]) => normalizar(a) !== normalizar(b)).length;
  return { diferentes, conhecidos: conhecidos.length, percentual: conhecidos.length ? Math.round(diferentes / conhecidos.length * 100) : 0 };
}

export function tokenDaTroca(id) {
  try { return sessionStorage.getItem(`troca:${id}`) || ''; } catch { return ''; }
}

export function ultimaTroca() {
  try { return sessionStorage.getItem('troca:ultima') || ''; } catch { return ''; }
}

export function lembrarTroca(id) {
  try { sessionStorage.setItem('troca:ultima', id); } catch { /* A navegação pela URL continua disponível. */ }
}

export function retornoDaComparacao(query, tradeInId) {
  const params = new URLSearchParams(query);
  const seguro = new URLSearchParams();
  for (const campo of ['meu', 'variante', 'estado', 'item']) {
    for (const valor of params.getAll(campo)) seguro.append(campo, valor);
  }
  seguro.set('passo', 'comparativo');
  seguro.set('tradeInId', tradeInId);
  return `/comparar?${seguro}`;
}

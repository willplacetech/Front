import { ordenarCapacidades } from './variantes.js';

export const FOTOS_TROCA = [
  { campo: 'frontal', label: 'Frente (tela)', dica: 'Mostre toda a tela, com o aparelho de frente.' },
  { campo: 'traseira', label: 'Traseira', dica: 'Mostre toda a parte traseira, incluindo as câmeras.' },
  { campo: 'superior', label: 'Superior', dica: 'Fotografe a borda de cima do aparelho.' },
  { campo: 'inferior', label: 'Inferior', dica: 'Mostre a entrada do carregador e os alto-falantes.' },
  { campo: 'lateralEsq', label: 'Lateral esquerda', dica: 'Mostre a borda esquerda e seus botões.' },
  { campo: 'lateralDir', label: 'Lateral direita', dica: 'Mostre a borda direita e seus botões.' }
];
export const LIMITE_FOTO = 5 * 1024 * 1024;
export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const CAMPOS_CONTATO = ['nome', 'email', 'telefone'];
export const CAMPOS_PASSOS = [
  ['modeloAparelho', 'capacidade', 'cor'],
  FOTOS_TROCA.map(({ campo }) => `fotos.${campo}`),
  ['descricaoEstado', 'imei'],
  CAMPOS_CONTATO
];

export function validarFoto(arquivo) {
  if (!arquivo) return 'Adicione uma foto deste ângulo.';
  if (!TIPOS_FOTO.includes(arquivo.type)) return 'Use uma imagem JPEG, PNG ou WebP.';
  if (!arquivo.size) return 'O arquivo está vazio. Escolha outra foto.';
  if (arquivo.size > LIMITE_FOTO) return 'Cada foto deve ter no máximo 5 MB.';
  return true;
}

export async function validarConteudoFoto(arquivo) {
  const metadados = validarFoto(arquivo);
  if (metadados !== true) return metadados;
  try {
    const bytes = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
    const inicio = valores => valores.every((valor, indice) => bytes[indice] === valor);
    const assinatura = arquivo.type === 'image/jpeg' ? inicio([255, 216, 255])
      : arquivo.type === 'image/png' ? inicio([137, 80, 78, 71, 13, 10, 26, 10])
        : inicio([82, 73, 70, 70]) && [87, 69, 66, 80].every((valor, indice) => bytes[indice + 8] === valor);
    return assinatura || 'O conteúdo da foto não corresponde ao formato. Escolha outra imagem.';
  } catch {
    return 'Não foi possível ler a foto. Escolha o arquivo novamente.';
  }
}

export function validarImei(imei) {
  if (!/^[0-9]{15}$/.test(imei || '')) return 'Informe um IMEI com exatamente 15 dígitos.';
  // A API existente também exige o dígito verificador de um IMEI real.
  const soma = [...imei].reduce((total, valor, indice) => {
    const numero = Number(valor) * (indice % 2 === 1 ? 2 : 1);
    return total + (numero > 9 ? numero - 9 : numero);
  }, 0);
  return soma % 10 === 0 || 'IMEI inválido. Confira o número exibido no seu aparelho.';
}

export function modelosDoCatalogo(produtos) {
  const modelos = new Map();
  for (const produto of produtos) {
    const nome = produto.nome;
    if (!nome) continue;
    if (!modelos.has(nome)) modelos.set(nome, { nome, variantes: [] });
    modelos.get(nome).variantes.push(...(produto.variants || []));
  }
  return [...modelos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
}

export function opcoesDoModelo(modelo, capacidade = '') {
  const variantes = modelo?.variantes || [];
  return {
    capacidades: ordenarCapacidades([...new Set(variantes.map(v => v.capacidade).filter(Boolean))]),
    cores: [...new Set(variantes.filter(v => !capacidade || v.capacidade === capacidade).map(v => v.cor).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  };
}

export function dadosParaEnvio(dados) {
  const formulario = new FormData();
  for (const campo of [...CAMPOS_PASSOS[0], ...CAMPOS_PASSOS[2], ...CAMPOS_CONTATO]) {
    formulario.append(campo, String(dados[campo] || '').trim());
  }
  for (const { campo } of FOTOS_TROCA) formulario.append(campo, dados.fotos[campo], dados.fotos[campo].name);
  return formulario;
}

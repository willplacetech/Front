/**
 * Parser para extrair produtos da lista de preços do fornecedor Apple
 * Identifica padrões estruturados de: PRODUTO SPECS + cores + preços
 */

export function parseListaPrecos(texto, opcoes = {}) {
  const percentual = Number.isFinite(Number(opcoes.percentual)) ? Number(opcoes.percentual) : 7;
  const valorFixo = Number.isFinite(Number(opcoes.valorFixo)) ? Number(opcoes.valorFixo) : 500;
  const produtos = [];
  let categoriaAtual = '';
  let produtoAtual = null;

  const linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const removerEmojis = (valor) => valor
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  const parsePreco = (valor) => {
    const normalizado = valor.replace(/\s/g, '');
    if (normalizado.includes(',') && normalizado.includes('.')) {
      return Number(normalizado.replace(/\./g, '').replace(',', '.'));
    }
    if ((normalizado.match(/\./g) || []).length > 1) {
      const partes = normalizado.split('.');
      return Number(`${partes.slice(0, -1).join('')}.${partes.at(-1)}`);
    }
    if (normalizado.includes(',')) {
      return Number(normalizado.replace(',', '.'));
    }
    return Number(normalizado);
  };

  const limparNome = (valor) => {
    const semSimbolos = valor
      .replace(/^[^A-Za-zÀ-ÿ0-9]+/, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*(CPO|LACRADO|NOVIDADE|DE\s*\d+.*|M\d+)\s*/gi, ' ');
    return removerEmojis(semSimbolos);
  };

  const adicionarProduto = (nome, precoCusto, cor = '') => {
    if (!nome || !Number.isFinite(precoCusto) || precoCusto <= 0 || precoCusto >= 100000) return;
    const nomeFinal = cor && cor !== nome ? `${nome} - ${cor}` : nome;
    if (nomeFinal.length <= 5) return;

    produtos.push({
      nome: nomeFinal,
      categoria: categoriaAtual || 'Sem Categoria',
      preçoCusto: precoCusto,
      precoFinal: parseFloat((precoCusto * (1 + percentual / 100) + valorFixo).toFixed(2)),
      descricao: `Custo: R$ ${precoCusto.toFixed(2)} | Categoria: ${categoriaAtual}`,
      imagem: '',
      cor,
      disponivel: true
    });
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    
    // DETECTAR CATEGORIAS (linhas com ⬇️)
    if (linha.includes('⬇️')) {
      categoriaAtual = linha
        .replace(/[⬇️⬜️🟦🟧🟨🟩🟪⬛️🟫—⸻-]/g, '')
        .replace(/IPHONE|IPAD|MACBOOK|AIRPODS|APPLE|WATCH|ACESSORIOS/gi, '')
        .trim();
      categoriaAtual = removerEmojis(categoriaAtual).substring(0, 50);
      continue;
    }

    // Linhas com preço na mesma linha do produto, como AIRPODS 4 REGULAR *R$ 710.00*.
    const precoNaLinha = linha.match(/\*?R\$\s*([\d.,]+)\*?/i);
    const textoSemPreco = precoNaLinha ? linha.slice(0, precoNaLinha.index).trim() : linha;
    const comecaComEmoji = /^[^A-Za-zÀ-ÿ0-9\s]/u.test(textoSemPreco);

    if (precoNaLinha && !comecaComEmoji) {
      adicionarProduto(limparNome(textoSemPreco), parsePreco(precoNaLinha[1]));
      produtoAtual = limparNome(textoSemPreco);
      continue;
    }

    if (precoNaLinha && comecaComEmoji) {
      const nome = limparNome(textoSemPreco);
      const precoCusto = parsePreco(precoNaLinha[1]);
      const linhaDeCor = produtoAtual && nome.length < 45 && !/\b(?:IPHONE|IPAD|MAC|WATCH|GARMIN|AIRPODS|PENCIL|MOUSE|KEYBOARD|TRACKPAD|AIRTAG)\b/i.test(nome);
      adicionarProduto(linhaDeCor ? produtoAtual : nome, precoCusto, linhaDeCor ? nome : '');
      if (!linhaDeCor) produtoAtual = nome;
      continue;
    }

    // Detecta qualquer linha de produto, inclusive com vários emojis no início.
    if (comecaComEmoji) {
      produtoAtual = limparNome(textoSemPreco);
      continue;
    }

    // Linhas especiais que resetam o produto atual
    if (linha.startsWith('—') || linha.startsWith('⸻') || linha.includes('IMPORTANTE') || linha.includes('GARANTIA')) {
      produtoAtual = null;
    }
  }

  // Cada cor é um produto distinto no catálogo; só remove linhas exatamente repetidas.
  return produtos.filter((produto, indice, lista) => lista.findIndex(outro => outro.nome === produto.nome) === indice);
}

/**
 * Busca imagem do produto na web via Unsplash
 */
export async function buscarImagemProduto(nomeProduto) {
  try {
    // Se não tiver chave do Unsplash, deixa vazio
    // O backend buscará automaticamente
    return '';
  } catch (erro) {
    console.error('Erro ao buscar imagem:', erro);
    return '';
  }
}

/**
 * Parser para extrair produtos da lista de preços do fornecedor Apple
 * Identifica padrões estruturados de: PRODUTO SPECS + cores + preços
 */

export function parseListaPrecos(texto) {
  const produtos = [];
  let categoriaAtual = '';
  let produtoAtual = null;
  let ultimoEmoji = '';

  const linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    
    // DETECTAR CATEGORIAS (linhas com ⬇️)
    if (linha.includes('⬇️')) {
      categoriaAtual = linha
        .replace(/[⬇️⬜️🟦🟧🟨🟩🟪⬛️🟫—⸻-]/g, '')
        .replace(/IPHONE|IPAD|MACBOOK|AIRPODS|APPLE|WATCH|ACESSORIOS/gi, '')
        .trim();
      categoriaAtual = categoriaAtual.replace(/\s+/g, ' ').substring(0, 50);
      continue;
    }

    // DETECTAR NOMES DE PRODUTOS
    // Padrão: começa com emoji de produto (📱 🔲 💻 ⌚️ 🎧 etc)
    const produtoMatch = linha.match(/^([📱🔲💻⌚️🎧🖥️🥚✏️⌨️🖱️⛓️])\s*([^*R$]+?)(?:\s*\d+[Gg][Bb])?(?:\s*2[0-9]{3})?(?:\s*\(.*?\))?$/);
    
    if (produtoMatch) {
      ultimoEmoji = produtoMatch[1];
      produtoAtual = produtoMatch[2].trim();
      // Remove "CPO", "MACBOOK AIR", etc do nome para ficar mais limpo
      produtoAtual = produtoAtual.replace(/\s*(CPO|LACRADO|NOVIDADE|DE\s*\d+.*|M[0-9])\s*/gi, ' ').trim();
      continue;
    }

    // DETECTAR LINHAS DE PREÇO
    // Padrão: "🟦 COR *R$ PREÇO*" ou "🟫 COR *R$ PREÇO*" ou "⬜️ COR *R$ PREÇO*"
    const precoMatch = linha.match(/^([🟫⬜️🟦🟧🟨🟩🟪⬛️])\s*([^*]*?)\s*\*?R\$\s*([\d.,]+)\*?$/);
    
    if (precoMatch && produtoAtual) {
      const cor = precoMatch[2].trim();
      const precoStr = precoMatch[3].trim();
      
      // Parse do preço: "6.990.00" -> 6990, ou "6,990.00" -> 6990
      const precoCusto = parseFloat(precoStr.replace(/\./g, '').replace(',', '.'));

      if (precoCusto > 0 && precoCusto < 100000) { // Validação de preço
        // Calcula o preço final: (custo × 1,07) + R$ 500
        const precoFinal = parseFloat(((precoCusto * 1.07) + 500).toFixed(2));
        
        const nomeFinal = cor && cor !== produtoAtual 
          ? `${produtoAtual} - ${cor}` 
          : produtoAtual;

        // Verifica se já existe um produto com este nome (para não duplicar)
        const existe = produtos.some(p => p.nome === nomeFinal);
        
        if (!existe && nomeFinal.length > 5) {
          produtos.push({
            nome: nomeFinal,
            categoria: categoriaAtual || 'Sem Categoria',
            preçoCusto: precoCusto,
            precoFinal: precoFinal,
            descricao: `Custo: R$ ${precoCusto.toFixed(2)} | Categoria: ${categoriaAtual}`,
            imagem: '',
            cor: cor,
            disponivel: true
          });
        }
      }
    }

    // Linhas especiais que resetam o produto atual
    if (linha.startsWith('—') || linha.startsWith('⸻') || linha.includes('IMPORTANTE') || linha.includes('GARANTIA')) {
      produtoAtual = null;
    }
  }

  // Remove duplicatas (mesma cor de um modelo em cores diferentes)
  const nomeUnicos = new Map();
  
  return produtos.filter(p => {
    const chave = p.nome.replace(/\s*-\s*[A-Z\s]+$/i, ''); // Remove a cor do final
    
    if (nomeUnicos.has(chave)) {
      const existente = nomeUnicos.get(chave);
      // Mantém o de menor preço (provavelmente a cor padrão)
      if (p.precoFinal < existente.precoFinal) {
        nomeUnicos.set(chave, p);
        return true;
      }
      return false;
    }
    
    nomeUnicos.set(chave, p);
    return true;
  });
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

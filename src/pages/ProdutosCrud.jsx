import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import ImportadorPrecos from '../components/ImportadorPrecos';
import EditorVariantes from '../components/EditorVariantes';

// CORES OFICIAIS
const AZUL = 'var(--brand)';
const VERDE = 'var(--brand)';
const VERMELHO = 'var(--text-secondary)';
const CINZA = 'var(--bg-surface-2)';

const calcularPrecoVendaPadrao = (custo) => {
  const valor = Number(custo);
  return Number.isFinite(valor) && valor > 0 ? Number((valor * 1.07 + 500).toFixed(2)) : '';
};

// ✅ ESTRUTURA PADRÃO DE UM PRODUTO
const produtoVazio = () => ({
  nome: '',
  preco: '',
  precoPersonalizado: '',
  categoria: '',
  imagem: '',
  descricao: '',
  disponivel: true
});

export default function ProdutosCrud() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [importadorAberto, setImportadorAberto] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [percentualLote, setPercentualLote] = useState(7);
  const [valorFixoLote, setValorFixoLote] = useState(500);
  const [ajustandoLote, setAjustandoLote] = useState(false);
  const [excluindoLote, setExcluindoLote] = useState(false);
  const [ordenacao, setOrdenacao] = useState({ campo: 'nome', direcao: 'asc' });
  const [precoEmEdicao, setPrecoEmEdicao] = useState(null);
  const [valorPrecoEdicao, setValorPrecoEdicao] = useState('');
  const [salvandoPreco, setSalvandoPreco] = useState(false);

  // 🤖 PROCESSAMENTO POR IA — NOVO SISTEMA DE SESSÕES
  const [listaBruta, setListaBruta] = useState('');
  const [provedorIa, setProvedorIa] = useState('groq');
  const [nomeInstanciaIa, setNomeInstanciaIa] = useState('Meu ChatGPT');
  const [modeloIa, setModeloIa] = useState('gpt-4.1-mini');
  const [apiKeyIa, setApiKeyIa] = useState('');
  const [processandoIa, setProcessandoIa] = useState(false);
  const [mostrarProcessador, setMostrarProcessador] = useState(false);
  const [sessaoId, setSessaoId] = useState(null);
  const [temSessaoPendente, setTemSessaoPendente] = useState(false);
  const [progressoIa, setProgressoIa] = useState({
    fase: 'ociosa', // ociosa | analisando | processando | concluido | parcial
    atual: 0,        // lotes concluídos
    total: 0,        // total de lotes
    percentual: 0,
    inicio: 0,
    estimativaTotal: 0,
    tempoRestante: 0,
    produtosAcumulados: 0,
    lotesFalhos: 0
  });
  const [tempoDecorridoIa, setTempoDecorridoIa] = useState(0);
  const intervaloProgressoIa = useRef(null);

  // ✅ LISTA DE NOVOS PRODUTOS PARA CADASTRAR
  const [listaNovos, setListaNovos] = useState([produtoVazio()]);
  const [somentePrecos, setSomentePrecos] = useState(true);

  const carregar = () => {
    api.get('/produtos/administracao').then(r => { setProdutos(r.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  // 🧹 Garante limpeza do intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervaloProgressoIa.current) {
        window.clearInterval(intervaloProgressoIa.current);
      }
    };
  }, []);

  // 🤖 FUNÇÃO AUXILIAR: Converte produtos da sessão para formato do formulário
  const converterParaFormulario = (produtosSessao) => {
    return produtosSessao.map(p => {
      let precoLimpo = '';
      if (p.preco) {
        precoLimpo = String(p.preco)
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
          .replace(/[^0-9.]/g, '');
      }

      let nomeCompleto = p.nome?.trim() || '';
      if (p.cor && !nomeCompleto.toLowerCase().includes(p.cor.toLowerCase())) {
        nomeCompleto += ` - ${p.cor}`;
      }
      if (p.capacidade && !nomeCompleto.includes(p.capacidade)) {
        nomeCompleto += ` ${p.capacidade}`;
      }

      return {
        ...produtoVazio(),
        nome: nomeCompleto,
        categoria: p._categoria?.trim() || p.categoria?.trim() || '',
        preco: precoLimpo || '',
        precoPersonalizado: calcularPrecoVendaPadrao(precoLimpo),
              imagem: /^https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s]*)?$/i.test(p.imagemUrl?.trim() || '') ? p.imagemUrl.trim() : '',
        descricao: p.descricao?.trim() || ''
      };
    });
  };

  // 🤖 FUNÇÃO PRINCIPAL — Processa lote por lote com sessão
  const processarListaComIa = async (continuar = false) => {
    if (provedorIa === 'openai' && (!apiKeyIa.trim() || !modeloIa.trim())) {
      alert('Informe o modelo e a API key da instância ChatGPT.');
      return;
    }
    if (!continuar && !listaBruta.trim()) {
      alert('⚠️ Cole sua lista de produtos antes de processar!');
      return;
    }

    if (intervaloProgressoIa.current) {
      window.clearInterval(intervaloProgressoIa.current);
    }

    setProcessandoIa(true);
    const inicio = Date.now();
    let idSessao = sessaoId;

    try {
      let totalLotes = progressoIa.total;

      // 🆕 Se NÃO for continuar, cria NOVA sessão
      if (!continuar) {
        const resSessao = await api.post('/produtos/processar-iniciar', {
          listaBruta, provedorIa,
          ...(provedorIa === 'openai' ? { nomeInstanciaIa, modeloIa: modeloIa.trim(), apiKey: apiKeyIa.trim() } : {})
        });
        idSessao = resSessao.data.sessaoId;
        totalLotes = resSessao.data.totalLotes;
        setSessaoId(idSessao);
      } else {
        // 🔄 Se for continuar, primeiro retenta lotes falhos
        await api.post(`/produtos/processar-retentar/${idSessao}`);
      }

      // Inicializa progresso
      setProgressoIa({
        fase: 'processando',
        atual: 0,
        total: totalLotes,
        percentual: 0,
        inicio,
        estimativaTotal: Math.max(10, totalLotes * 8),
        tempoRestante: Math.max(10, totalLotes * 8),
        produtosAcumulados: 0,
        lotesFalhos: 0
      });
      setTempoDecorridoIa(0);

      // ⏱️ Atualiza tempo restante
      intervaloProgressoIa.current = window.setInterval(() => {
        setProgressoIa(atual => {
          if (atual.fase === 'concluido' || atual.fase === 'parcial') return atual;
          const decorrido = (Date.now() - atual.inicio) / 1000;
          setTempoDecorridoIa(Math.max(0, Math.round(decorrido)));
          const tempoRestante = Math.max(0, Math.round(atual.estimativaTotal - decorrido));
          return { ...atual, tempoRestante };
        });
      }, 1000);

      // 🔄 Processa UM LOTE POR VEZ
      let concluiu = false;
      let produtosFinais = [];

      while (!concluiu) {
        const res = await api.post(`/produtos/processar-proximo/${idSessao}`, {
          ...(provedorIa === 'openai' ? { apiKey: apiKeyIa.trim() } : {})
        });
        const { sucesso, concluido, produtos, sessao } = res.data;

        if (!sucesso && !concluido) {
          throw new Error(res.data.erro || 'Erro no processamento');
        }

        // Atualiza progresso REAL baseado em lotes concluídos
        const percentual = Math.round((sessao.lotesConcluidos / sessao.totalLotes) * 100);

        setProgressoIa(atual => ({
          ...atual,
          fase: concluido ? (sessao.lotesFalhos > 0 ? 'parcial' : 'concluido') : 'processando',
          atual: sessao.lotesConcluidos,
          total: sessao.totalLotes,
          percentual,
          produtosAcumulados: sessao.totalProdutos,
          lotesFalhos: sessao.lotesFalhos
        }));

        if (produtos) produtosFinais = produtos;
        concluiu = concluido;

        await new Promise(r => setTimeout(r, 200));
      }

      // ✅ FIM DO PROCESSAMENTO
      if (produtosFinais.length === 0) {
        alert('⚠️ Nenhum produto foi reconhecido na lista.');
        return;
      }

      const produtosConvertidos = converterParaFormulario(produtosFinais);

      setProgressoIa(atual => ({
        ...atual,
        fase: 'concluido',
        atual: atual.total,
        percentual: 100,
        tempoRestante: 0
      }));

      setListaNovos(produtosConvertidos);
      setMostrarProcessador(false);
      setListaBruta('');
      setMostrarForm(true);
      setSessaoId(null);
      setTemSessaoPendente(false);

      const tempoTotal = Math.round((Date.now() - inicio) / 1000);
      const temFalhos = progressoIa.lotesFalhos > 0;

      setTimeout(() => {
        alert(
          `✅ ${produtosConvertidos.length} produtos extraídos em ${tempoTotal}s!` +
          (temFalhos ? `\n\n⚠️ Alguns lotes falharam. Clique em "Continuar" para tentar novamente.` : '')
        );
      }, 300);

    } catch (erro) {
      const msg = erro.response?.data?.erro || erro.message || 'Erro desconhecido';

      // Marca que tem sessão pendente para poder continuar
      if (idSessao) {
        setTemSessaoPendente(true);
      }

      alert(
        `❌ Erro ao processar:\n${msg}\n\n` +
        (idSessao ? '💡 Você pode CONTINUAR de onde parou clicando no botão "Continuar Processamento".' : '')
      );
    } finally {
      if (intervaloProgressoIa.current) {
        window.clearInterval(intervaloProgressoIa.current);
        intervaloProgressoIa.current = null;
      }
      setProcessandoIa(false);
    }
  };

  // 🆕 FUNÇÃO: Continuar processamento de onde parou
  const continuarProcessamento = () => {
    if (sessaoId) {
      processarListaComIa(true);
    }
  };

  // 🆕 FUNÇÃO: Cancelar sessão pendente
  const cancelarSessao = () => {
    setSessaoId(null);
    setTemSessaoPendente(false);
    setProgressoIa({
      fase: 'ociosa', atual: 0, total: 0, percentual: 0,
      inicio: 0, estimativaTotal: 0, tempoRestante: 0,
      produtosAcumulados: 0, lotesFalhos: 0
    });
  };

  // ✅ ADICIONA UMA NOVA LINHA NA LISTA
  const adicionarLinha = () => {
    setListaNovos([...listaNovos, produtoVazio()]);
  };

  // ✅ REMOVE UMA LINHA DA LISTA
  const removerLinha = (indice) => {
    if (listaNovos.length === 1) return;
    setListaNovos(listaNovos.filter((_, i) => i !== indice));
  };

  // ✅ ATUALIZA OS DADOS DE UMA LINHA
  const alterarLinha = (indice, campo, valor) => {
    const novaLista = [...listaNovos];
    novaLista[indice] = { ...novaLista[indice], [campo]: valor };
    if (campo === 'preco' && !novaLista[indice].precoPersonalizado) {
      novaLista[indice].precoPersonalizado = calcularPrecoVendaPadrao(valor);
    }
    setListaNovos(novaLista);
  };

  // ✅ SALVA TODOS OS PRODUTOS DE UMA VEZ
  const salvarTodos = async (e) => {
    e.preventDefault();
    const invalidos = listaNovos.filter(p => !p.nome.trim() || !p.preco);
    if (invalidos.length > 0) {
      alert(`⚠️ Preencha Nome e Preço em todos os produtos! (${invalidos.length} sem dados)`);
      return;
    }
    setSalvando(true);
    try {
      if (somentePrecos) {
        const { data } = await api.post('/produtos/atualizar-precos-lote', { produtos: listaNovos });
        const { sucesso, ignorados, erros } = data.resultados;
        alert(`${sucesso.length} preço(s) atualizado(s). ${ignorados.length} item(ns) não cadastrado(s) ignorado(s). ${erros.length} erro(s).` + (erros.length ? '\n' + erros.map(item => `${item.nome}: ${item.erro}`).join('\n') : ''));
        setListaNovos(listaNovos.filter((_, indice) => !sucesso.some(item => item.indice === indice)));
        if (sucesso.length === listaNovos.length) {
          setListaNovos([produtoVazio()]);
          setMostrarForm(false);
        }
        carregar();
        return;
      }
      const promessas = listaNovos.map(produto => {
        const dados = {
          ...produto,
          preco: Number(produto.preco),
          precoPersonalizado: produto.precoPersonalizado ? Number(produto.precoPersonalizado) : undefined
        };
        return api.post('/produtos', dados);
      });
      await Promise.all(promessas);
      alert(`✅ ${listaNovos.length} produto(s) cadastrado(s) com sucesso!`);
      setListaNovos([produtoVazio()]);
      setMostrarForm(false);
      carregar();
    } catch (erro) {
      console.error(erro);
      alert('❌ Erro ao cadastrar um ou mais produtos!');
    } finally {
      setSalvando(false);
    }
  };

  // Editar e Excluir
  const [editando, setEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState(produtoVazio());

  const editar = (p) => {
    setFormEdicao({ ...p });
    setEditando(p);
    setMostrarForm(false);
    setMostrarProcessador(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvarEdicao = (e) => {
    e.preventDefault();
    const dados = {
      ...formEdicao,
      preco: Number(formEdicao.preco),
      precoPersonalizado: formEdicao.precoPersonalizado ? Number(formEdicao.precoPersonalizado) : undefined
    };
    api.put(`/produtos/${editando._id}`, dados)
      .then(() => {
        setEditando(null);
        setFormEdicao(produtoVazio());
        carregar();
      });
  };

  const deletar = (id) => {
    if (confirm('Excluir este produto?')) {
      api.delete(`/produtos/${id}`).then(carregar);
    }
  };

  const iniciarEdicaoPreco = (produto, campo) => {
    if (produto.variants?.length) { editar(produto); return; }
    setPrecoEmEdicao({ id: produto._id, campo });
    setValorPrecoEdicao(campo === 'preco' ? produto.preco : (produto.precoPersonalizado || calcularPrecoVendaPadrao(produto.preco)));
  };

  const cancelarEdicaoPreco = () => {
    setPrecoEmEdicao(null);
    setValorPrecoEdicao('');
  };

  const salvarPrecoInline = async () => {
    if (!precoEmEdicao) return;
    const valor = Number(String(valorPrecoEdicao).replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      alert('Informe um valor de preço válido.');
      return;
    }

    setSalvandoPreco(true);
    try {
      await api.put(`/produtos/${precoEmEdicao.id}`, { [precoEmEdicao.campo]: Number(valor.toFixed(2)) });
      cancelarEdicaoPreco();
      carregar();
    } catch (erro) {
      console.error('Erro ao salvar preço:', erro);
      alert('Não foi possível salvar o preço.');
    } finally {
      setSalvandoPreco(false);
    }
  };

  const tratarTeclaPreco = (event) => {
    if (event.key === 'Enter') salvarPrecoInline();
    if (event.key === 'Escape') cancelarEdicaoPreco();
  };

  const alternarSelecao = (id) => {
    setSelecionados(atual => atual.includes(id)
      ? atual.filter(item => item !== id)
      : [...atual, id]);
  };

  const selecionarFiltrados = (marcado) => {
    const idsFiltrados = produtosFiltrados.map(p => p._id);
    setSelecionados(atual => marcado
      ? [...new Set([...atual, ...idsFiltrados])]
      : atual.filter(id => !idsFiltrados.includes(id)));
  };

  const aplicarAjusteLote = async () => {
    const percentual = Number(percentualLote);
    const valorFixo = Number(valorFixoLote);
    const escolhidos = produtos.filter(p => selecionados.includes(p._id));
    if (!escolhidos.length || !Number.isFinite(percentual) || percentual < 0 || !Number.isFinite(valorFixo) || valorFixo < 0) {
      alert('Informe uma margem e um valor fixo válidos.');
      return;
    }
    if (!window.confirm(`Atualizar o preço de venda de ${escolhidos.length} produto(s)?`)) return;
    setAjustandoLote(true);
    try {
      await Promise.all(escolhidos.map(produto => {
        if (produto.variants?.length) return api.put(`/produtos/${produto._id}`, {
          variants: produto.variants.map(v => ({ ...v, preco: Number((Number(v.precoCusto || v.preco) * (1 + percentual / 100) + valorFixo).toFixed(2)) }))
        });
        const precoBase = Number(produto.preco);
        const precoVenda = Number((precoBase * (1 + percentual / 100) + valorFixo).toFixed(2));
        return api.put(`/produtos/${produto._id}`, { precoPersonalizado: precoVenda });
      }));
      alert(`${escolhidos.length} preço(s) de venda atualizado(s)!`);
      setSelecionados([]);
      carregar();
    } catch (erro) {
      console.error('Erro no ajuste em lote:', erro);
      alert('Não foi possível atualizar todos os preços.');
    } finally {
      setAjustandoLote(false);
    }
  };

  const excluirSelecionados = async () => {
    const escolhidos = produtos.filter(p => selecionados.includes(p._id));
    if (!escolhidos.length) return;
    if (!window.confirm(`Excluir permanentemente ${escolhidos.length} produto(s) selecionado(s)?`)) return;
    setExcluindoLote(true);
    try {
      await Promise.all(escolhidos.map(produto => api.delete(`/produtos/${produto._id}`)));
      alert(`${escolhidos.length} produto(s) excluído(s) com sucesso!`);
      setSelecionados([]);
      carregar();
    } catch (erro) {
      console.error('Erro ao excluir em lote:', erro);
      alert('Não foi possível excluir todos os produtos selecionados.');
      carregar();
    } finally {
      setExcluindoLote(false);
    }
  };

  const categorias = [...new Set(
    produtos
      .map(produto => produto.categoria?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Filtrar por categoria e, opcionalmente, pelo texto digitado.
  const produtosFiltrados = produtos.filter(produto => {
    const correspondeCategoria = !categoriaAtiva || produto.categoria?.trim() === categoriaAtiva;
    const correspondeTexto = !filtro || Object.values(produto).join(' ').toLowerCase().includes(filtro.toLowerCase());
    return correspondeCategoria && correspondeTexto;
  });

  const todosFiltradosSelecionados = produtosFiltrados.length > 0 && produtosFiltrados.every(p => selecionados.includes(p._id));

  const ordenarPor = (campo) => {
    setOrdenacao(atual => ({
      campo,
      direcao: atual.campo === campo && atual.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const valorOrdenacao = (produto, campo) => {
    if (campo === 'preco') return Number(produto.precoPersonalizado || produto.preco || 0);
    if (campo === 'status') return produto.disponivel ? 1 : 0;
    return String(produto[campo] || '').toLocaleLowerCase('pt-BR');
  };

  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    const primeiro = valorOrdenacao(a, ordenacao.campo);
    const segundo = valorOrdenacao(b, ordenacao.campo);
    if (primeiro < segundo) return ordenacao.direcao === 'asc' ? -1 : 1;
    if (primeiro > segundo) return ordenacao.direcao === 'asc' ? 1 : -1;
    return 0;
  });

  const indicadorOrdenacao = (campo) => ordenacao.campo === campo ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : '↕';

  // 🎨 Texto da fase de processamento — ATUALIZADO PARA LOTES
  const textoFase = () => {
    switch (progressoIa.fase) {
      case 'processando':
        return `📦 Processando lote ${progressoIa.atual + 1} de ${progressoIa.total}... (${progressoIa.produtosAcumulados} produtos)`;
      case 'concluido':
        return '✅ Concluído!';
      case 'parcial':
        return `⚠️ Parcial: ${progressoIa.atual}/${progressoIa.total} lotes OK (${progressoIa.lotesFalhos} falharam)`;
      default:
        return '🔍 Preparando processamento...';
    }
  };

  return (
    <LayoutAdmin titulo="Produtos" subtitulo="Cadastre manualmente ou cole sua lista e a IA extrai tudo automaticamente ✨" contentMaxWidth="1800px">

      {/* 🔍 FILTRO + BOTÕES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '18px', height: '18px', color: 'var(--text-secondary)'
          }} />
          <input
            placeholder="Filtrar produtos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)', fontSize: '15px', outline: 'none',
              transition: 'border 0.2s', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--brand)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setMostrarProcessador(!mostrarProcessador);
              setMostrarForm(false);
              setEditando(null);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: 'var(--brand)', color: 'var(--bg-base)', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 12px 22px rgba(255,255,255,0.08)'
            }}
          >
            <SparklesIcon style={{ width: '18px', height: '18px' }} />
            {mostrarProcessador ? 'Fechar' : '📋 Colar Lista (IA)'}
          </button>
          <button
            onClick={() => {
              setMostrarForm(!mostrarForm);
              setEditando(null);
              setListaNovos([produtoVazio()]);
              setMostrarProcessador(false);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: 'var(--brand)', color: 'var(--bg-base)', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 12px 22px rgba(245,165,36,0.18)'
            }}
          >
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            {mostrarForm ? 'Fechar' : 'Cadastro Manual'}
          </button>
          <button
            onClick={() => {
              setMostrarForm(false);
              setMostrarProcessador(false);
              setImportadorAberto(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: 'var(--brand)', color: 'var(--bg-base)', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 12px 22px rgba(255,255,255,0.08)'
            }}
          >
            📊 Importar Preços
          </button>
        </div>
      </div>

      {/* ⚡ ACESSO RÁPIDO ÀS CATEGORIAS */}
      {categorias.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Categorias
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['', ...categorias].map(categoria => {
              const ativa = categoriaAtiva === categoria;
              const quantidade = categoria
                ? produtos.filter(produto => produto.categoria?.trim() === categoria).length
                : produtos.length;
              return (
                <button
                  key={categoria || 'todas'}
                  type="button"
                  onClick={() => setCategoriaAtiva(categoria)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 13px',
                    borderRadius: '10px', border: ativa ? '1px solid var(--brand)' : '1px solid rgba(255,255,255,0.1)',
                    background: ativa ? 'var(--brand)' : 'rgba(255,255,255,0.04)',
                    color: ativa ? 'var(--bg-base)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: ativa ? 700 : 600,
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  {categoria || 'Todas'}
                  <span style={{ color: ativa ? 'var(--bg-base)' : 'var(--text-secondary)', fontSize: '11px' }}>{quantidade}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 🤖 PROCESSADOR DE LISTA COM IA */}
      {mostrarProcessador && (
        <div style={{
          background: 'var(--bg-surface)', padding: '24px', borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px', boxShadow: '0 18px 40px rgba(0,0,0,0.18)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            ✨ Cole sua lista — a IA reconhece e preenche tudo!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Processa em lotes pequenos e salva cada um automaticamente. Se travar, é só continuar de onde parou! 🛡️
          </p>

          <fieldset disabled={processandoIa} style={{ border: '1px solid var(--text-secondary)', borderRadius: '12px', padding: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>
            <legend>Instância de IA</legend>
            <label className="block text-sm mb-3">
              Provedor
              <select className="block w-full mt-1 rounded-lg bg-neutral-900 border border-neutral-700 p-2" value={provedorIa} disabled={Boolean(sessaoId)} onChange={e => setProvedorIa(e.target.value)}>
                <option value="groq">Groq (configurado no servidor)</option>
                <option value="openai">ChatGPT (OpenAI API)</option>
              </select>
            </label>
            {provedorIa === 'openai' && <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">Nome da instância
                  <input className="block w-full mt-1 rounded-lg bg-neutral-900 border border-neutral-700 p-2" value={nomeInstanciaIa} maxLength={100} disabled={Boolean(sessaoId)} onChange={e => setNomeInstanciaIa(e.target.value)} />
                </label>
                <label className="text-sm">Modelo
                  <input className="block w-full mt-1 rounded-lg bg-neutral-900 border border-neutral-700 p-2" value={modeloIa} placeholder="gpt-4.1-mini" disabled={Boolean(sessaoId)} onChange={e => setModeloIa(e.target.value)} />
                </label>
              </div>
              <label className="block text-sm mt-3">API key da OpenAI
                <input type="password" autoComplete="off" spellCheck={false} className="block w-full mt-1 rounded-lg bg-neutral-900 border border-neutral-700 p-2" value={apiKeyIa} placeholder="sk-..." onChange={e => setApiKeyIa(e.target.value)} />
              </label>
              <p className="text-xs text-neutral-400 mt-2">A chave fica somente na memória desta página e é enviada ao servidor para processar sua lista. Informe novamente ao recarregar.</p>
            </>}
          </fieldset>

          {/* 🆕 AVISO DE SESSÃO PENDENTE */}
          {temSessaoPendente && sessaoId && !processandoIa && (
            <div style={{
              backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--brand)',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
            }}>
              <div>
                <strong style={{ color: 'var(--brand)', fontSize: '14px' }}>
                  ⚠️ Há um processamento inacabado!
                </strong>
                <div style={{ fontSize: '12px', color: 'var(--brand)', marginTop: '2px' }}>
                  Progresso: {progressoIa.atual}/{progressoIa.total} lotes | {progressoIa.produtosAcumulados} produtos salvos
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={continuarProcessamento}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', backgroundColor: 'var(--brand)', color: 'var(--bg-base)',
                    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                  Continuar Processamento
                </button>
                <button
                  onClick={cancelarSessao}
                  style={{
                    padding: '8px 12px', backgroundColor: 'transparent', color: 'var(--brand)',
                    border: '1px solid var(--brand)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <textarea
            value={listaBruta}
            onChange={(e) => {
              setListaBruta(e.target.value);
              if (temSessaoPendente) cancelarSessao();
            }}
            disabled={processandoIa}
            placeholder="Cole sua lista aqui...

Exemplo:
---
## IPHONES
Iphone 17 Pro Max 256GB - R$ 8.999,00
Tela de 6,9 polegadas, câmera 48MP, titânio
---
## MACBOOKS
MacBook Pro M4 16GB - R$ 12.499,00
Processador M4, 512GB SSD
---"
            style={{
              width: '100%', minHeight: '180px', padding: '14px', borderRadius: '12px',
              border: '1px solid var(--brand)', fontSize: '14px', fontFamily: 'monospace',
              outline: 'none', marginBottom: '14px', resize: 'vertical',
              opacity: processandoIa ? 0.6 : 1,
              backgroundColor: processandoIa ? 'var(--bg-surface-2)' : 'var(--bg-surface)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--brand)'}
            onBlur={e => e.target.style.borderColor = 'var(--brand)'}
          />

          {processandoIa && (
            <div style={{ marginBottom: '14px', padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', fontSize: '13px', color: 'var(--brand)', fontWeight: 600 }}>
                <span>{textoFase()}</span>
                <span>{progressoIa.percentual}%</span>
              </div>

              {/* Barra de progresso */}
              <div style={{ height: '12px', overflow: 'hidden', borderRadius: '999px', backgroundColor: 'var(--bg-surface-2)', position: 'relative' }}>
                <div
                  style={{
                    width: `${progressoIa.percentual}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: progressoIa.fase === 'concluido'
                      ? 'var(--brand)'
                      : progressoIa.fase === 'parcial'
                        ? 'var(--brand)'
                        : 'var(--brand)',
                    transition: 'width 0.4s ease',
                    position: 'relative'
                  }}
                >
                  {progressoIa.fase !== 'concluido' && progressoIa.fase !== 'parcial' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      animation: 'brilho 1.5s infinite'
                    }} />
                  )}
                </div>
              </div>

              {/* Informações detalhadas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '10px', fontSize: '12px', color: 'var(--brand)', flexWrap: 'wrap' }}>
                <span>📦 Lotes: {progressoIa.atual}/{progressoIa.total}</span>
                <span>🛍️ Produtos: {progressoIa.produtosAcumulados}</span>
                <span>⏱️ Decorrido: {tempoDecorridoIa}s</span>
                {progressoIa.fase !== 'concluido' && progressoIa.tempoRestante > 0 && (
                  <span>⏳ Restante: ~{progressoIa.tempoRestante}s</span>
                )}
                {progressoIa.lotesFalhos > 0 && (
                  <span style={{ color: 'var(--text-secondary)' }}>⚠️ Falhas: {progressoIa.lotesFalhos}</span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => processarListaComIa(false)}
            disabled={processandoIa}
            style={{
              padding: '12px 30px', backgroundColor: processandoIa ? 'var(--brand)' : 'var(--brand)',
              color: 'var(--bg-base)', border: 'none', borderRadius: '12px', fontSize: '15px',
              fontWeight: 600, cursor: processandoIa ? 'wait' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => !processandoIa && (e.target.style.backgroundColor = 'var(--brand)')}
            onMouseOut={e => !processandoIa && (e.target.style.backgroundColor = 'var(--brand)')}
          >
            {processandoIa ? (
              <>⏳ Processando em lotes... não feche a página</>
            ) : (
              <>✨ Extrair Produtos com IA</>
            )}
          </button>
        </div>
      )}

      {selecionados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
          <div>
            <strong style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '15px' }}>{selecionados.length} produto(s) selecionado(s)</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Preço de venda = preço base + percentual + valor fixo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Percentual (%)<input type="number" min="0" step="0.1" value={percentualLote} onChange={e => setPercentualLote(e.target.value)} style={{ display: 'block', width: '105px', marginTop: '4px', padding: '9px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} /></label>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fixo (R$)<input type="number" min="0" step="0.01" value={valorFixoLote} onChange={e => setValorFixoLote(e.target.value)} style={{ display: 'block', width: '105px', marginTop: '4px', padding: '9px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} /></label>
            <button type="button" onClick={aplicarAjusteLote} disabled={ajustandoLote} style={{ padding: '10px 16px', background: 'var(--brand)', color: 'var(--bg-base)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: ajustandoLote ? 'wait' : 'pointer' }}>{ajustandoLote ? 'Atualizando...' : 'Atualizar preços'}</button>
            <button type="button" onClick={excluirSelecionados} disabled={excluindoLote || ajustandoLote} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--bg-surface-2) 0%, var(--bg-surface-2) 100%)', color: 'var(--bg-base)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: excluindoLote ? 'wait' : 'pointer' }}>{excluindoLote ? 'Excluindo...' : 'Excluir selecionados'}</button>
            <button type="button" onClick={() => setSelecionados([])} style={{ padding: '10px 12px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer' }}>Limpar</button>
          </div>
        </div>
      )}

      {/* 📝 FORMULÁRIO DE VÁRIOS PRODUTOS */}
      {!importadorAberto && mostrarForm && (
        <form onSubmit={salvarTodos} style={{
          background: 'var(--bg-surface)', padding: '24px', borderRadius: '18px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.18)', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
            📦 Produtos prontos para cadastrar — {listaNovos.length} produto(s) na lista
          </h3>
          <label style={{ display: 'block', marginBottom: '16px', color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={somentePrecos} disabled={salvando} onChange={e => setSomentePrecos(e.target.checked)} /> Atualizar somente preços de produtos existentes
            <small style={{ display: 'block', marginTop: '6px' }}>Busca pelo nome completo, ignorando maiúsculas e minúsculas. Preserva os demais dados e ignora itens não cadastrados. Desmarque para cadastrar novos produtos.</small>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {listaNovos.map((produto, indice) => (
              <div key={indice} style={{
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Produto #{indice + 1}</span>
                  {listaNovos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerLinha(indice)}
                      style={{ border: 'none', background: 'transparent', color: VERMELHO, cursor: 'pointer', padding: '4px' }}
                    >
                      <XMarkIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome *</label>
                    <input
                      required
                      placeholder="Nome do produto"
                      value={produto.nome}
                      onChange={e => alterarLinha(indice, 'nome', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '14px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Preço R$ *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produto.preco}
                      onChange={e => alterarLinha(indice, 'preco', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Seu Preço (opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produto.precoPersonalizado}
                      onChange={e => alterarLinha(indice, 'precoPersonalizado', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Categoria</label>
                    <input
                      placeholder="Ex: Eletrônicos"
                      value={produto.categoria}
                      onChange={e => alterarLinha(indice, 'categoria', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>URL da Imagem</label>
                    <input
                      placeholder="https://..."
                      value={produto.imagem}
                      onChange={e => alterarLinha(indice, 'imagem', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Descrição</label>
                    <textarea
                      placeholder="Descrição do produto"
                      value={produto.descricao}
                      onChange={e => alterarLinha(indice, 'descricao', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', minHeight: '60px' }}
                    />
                  </div>
                  <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={produto.disponivel ?? true}
                      onChange={e => alterarLinha(indice, 'disponivel', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: AZUL }}
                    />
                    <span style={{ fontSize: '13px' }}>Disponível no catálogo</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={adicionarLinha}
            style={{
              marginTop: '16px', padding: '10px 20px', backgroundColor: CINZA,
              color: 'var(--text-primary)', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%'
            }}
          >
            ➕ Adicionar Outro Produto na Lista
          </button>
          <button
            type="submit"
            disabled={salvando}
            style={{
              marginTop: '20px', padding: '14px', backgroundColor: salvando ? 'var(--bg-surface-2)' : VERDE,
              color: 'var(--bg-base)', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer',
              width: '100%', transition: 'background 0.2s'
            }}
            onMouseOver={e => !salvando && (e.target.style.backgroundColor = 'var(--brand-hover)')}
            onMouseOut={e => !salvando && (e.target.style.backgroundColor = VERDE)}
          >
            {salvando ? 'Salvando...' : somentePrecos ? 'Atualizar somente preços' : `Salvar Todos os ${listaNovos.length} Produtos`}
          </button>
        </form>
      )}

      {/* ✏️ FORMULÁRIO DE EDIÇÃO INDIVIDUAL */}
      {editando?.variants?.length > 0 && <EditorVariantes key={editando._id} produto={editando} onClose={() => setEditando(null)} onSalvo={() => { setEditando(null); carregar(); }} />}
      {editando && !editando.variants?.length && (
        <form onSubmit={salvarEdicao} style={{
          background: 'var(--bg-surface)', padding: '24px', borderRadius: '18px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.18)', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>✏️ Editar Produto</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome *</label>
              <input
                required
                value={formEdicao.nome}
                onChange={e => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Preço Base R$ *</label>
              <input
                required type="number" step="0.01"
                value={formEdicao.preco}
                onChange={e => setFormEdicao({ ...formEdicao, preco: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Seu Preço R$</label>
              <input
                type="number" step="0.01"
                value={formEdicao.precoPersonalizado || ''}
                onChange={e => setFormEdicao({ ...formEdicao, precoPersonalizado: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Categoria</label>
              <input
                value={formEdicao.categoria}
                onChange={e => setFormEdicao({ ...formEdicao, categoria: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Imagem URL</label>
              <input
                value={formEdicao.imagem}
                onChange={e => setFormEdicao({ ...formEdicao, imagem: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Descrição</label>
              <textarea
                value={formEdicao.descricao}
                onChange={e => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', minHeight: '80px' }}
              />
            </div>
            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formEdicao.disponivel ?? true}
                onChange={e => setFormEdicao({ ...formEdicao, disponivel: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Disponível no catálogo</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => { setEditando(null); setFormEdicao(produtoVazio()); }}
              style={{ padding: '12px 24px', backgroundColor: CINZA, border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ padding: '12px 24px', backgroundColor: VERDE, color: 'var(--bg-base)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
            >
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* 📋 TABELA */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--text-primary)', borderTopColor: AZUL, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Carregando produtos...</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '18px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.18)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  {['', 'Foto', 'Produto', 'Preço custo', 'Preço venda', 'Categoria', 'Ações'].map((h, i) => (
                    <th key={i} style={{
                      padding: '14px 16px', textAlign: i === 6 ? 'right' : 'left',
                      fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em'
                    }}>{i === 0 ? <input type="checkbox" checked={todosFiltradosSelecionados} onChange={e => selecionarFiltrados(e.target.checked)} aria-label="Selecionar todos os produtos filtrados" style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: 'var(--brand)' }} /> : i === 2 || i === 3 || i === 4 || i === 5 ? <button type="button" onClick={() => ordenarPor({ 2: 'nome', 3: 'preco', 4: 'precoPersonalizado', 5: 'categoria' }[i])} style={{ border: 0, background: 'transparent', color: 'var(--text-secondary)', padding: 0, font: 'inherit', cursor: 'pointer' }}>{h} <span aria-hidden="true">{indicadorOrdenacao({ 2: 'nome', 3: 'preco', 4: 'precoPersonalizado', 5: 'categoria' }[i])}</span></button> : h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : produtosOrdenados.map(p => {
                  const preco = p.precoPersonalizado || calcularPrecoVendaPadrao(p.preco) || p.preco;
                  return (
                    <tr key={p._id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}><input type="checkbox" checked={selecionados.includes(p._id)} onChange={() => alternarSelecao(p._id)} aria-label={`Selecionar ${p.nome}`} style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: 'var(--brand)' }} /></td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '9px', overflow: 'hidden', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                          {p.imagem ? (
                            <img src={p.imagem} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/LogoEscrthinny.jpg'; }} />
                          ) : (
                            <img src="/LogoEscrthinny.jpg" alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.nome}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {precoEmEdicao?.id === p._id && precoEmEdicao.campo === 'preco' ? <input autoFocus type="number" min="0.01" step="0.01" value={valorPrecoEdicao} onChange={e => setValorPrecoEdicao(e.target.value)} onKeyDown={tratarTeclaPreco} onBlur={salvarPrecoInline} disabled={salvandoPreco} style={{ width: '110px', padding: '7px 8px', border: `1px solid var(--brand)`, borderRadius: '7px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} /> : <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--text-secondary)' }}>R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span><button type="button" onClick={() => iniciarEdicaoPreco(p, 'preco')} title="Editar preço de custo" aria-label="Editar preço de custo" style={{ border: 0, background: 'transparent', color: 'var(--brand)', cursor: 'pointer', padding: '3px' }}><PencilIcon style={{ width: '14px', height: '14px' }} /></button></div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {precoEmEdicao?.id === p._id && precoEmEdicao.campo === 'precoPersonalizado' ? <input autoFocus type="number" min="0.01" step="0.01" value={valorPrecoEdicao} onChange={e => setValorPrecoEdicao(e.target.value)} onKeyDown={tratarTeclaPreco} onBlur={salvarPrecoInline} disabled={salvandoPreco} style={{ width: '110px', padding: '7px 8px', border: `1px solid var(--brand)`, borderRadius: '7px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} /> : <div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '15px', color: 'var(--brand)' }}><span>R$ {Number(preco).toFixed(2).replace('.', ',')}</span><button type="button" onClick={() => iniciarEdicaoPreco(p, 'precoPersonalizado')} title="Editar preço de venda" aria-label="Editar preço de venda" style={{ border: 0, background: 'transparent', color: 'var(--brand)', cursor: 'pointer', padding: '3px' }}><PencilIcon style={{ width: '14px', height: '14px' }} /></button></div>{p.precoPersonalizado && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calculado/manual</div>}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.categoria || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => editar(p)} style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '34px', height: '34px', background: 'rgba(245,165,36,0.12)',
                            color: 'var(--brand)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(245,165,36,0.18)'
                          }} title="Editar">
                            <PencilIcon style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button onClick={() => deletar(p._id)} style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '34px', height: '34px', background: 'rgba(255,255,255,0.12)',
                            color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)'
                          }} title="Excluir">
                            <TrashIcon style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes brilho {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* IMPORTADOR DE PREÇOS */}
      {importadorAberto && (
        <ImportadorPrecos
          isOpen={importadorAberto}
          onClose={() => {
            setImportadorAberto(false);
            setMostrarForm(false);
          }}
          onSucesso={() => carregar()}
        />
      )}
    </LayoutAdmin>
  );
}

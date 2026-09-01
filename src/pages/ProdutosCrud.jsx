import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import ImportadorPrecos from '../components/ImportadorPrecos';

// CORES OFICIAIS
const AZUL = '#3483FA';
const VERDE = '#00A650';
const VERMELHO = '#EF4444';
const CINZA = '#F5F5F5';

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

  const carregar = () => {
    api.get('/produtos').then(r => { setProdutos(r.data); })
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
    if (!continuar && !listaBruta.trim()) {
      alert('⚠️ Cole sua lista de produtos antes de processar!');
      return;
    }

    if (intervaloProgressoIa.current) {
      window.clearInterval(intervaloProgressoIa.current);
    }

    setProcessandoIa(true);
    const inicio = Date.now();

    try {
      let idSessao = sessaoId;
      let totalLotes = progressoIa.total;

      // 🆕 Se NÃO for continuar, cria NOVA sessão
      if (!continuar) {
        const resSessao = await api.post('/produtos/processar-iniciar', { listaBruta });
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
        const res = await api.post(`/produtos/processar-proximo/${idSessao}`);
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
      console.error(erro);
      const msg = erro.response?.data?.erro || erro.message || 'Erro desconhecido';
      
      // Marca que tem sessão pendente para poder continuar
      if (sessaoId) {
        setTemSessaoPendente(true);
      }

      alert(
        `❌ Erro ao processar:\n${msg}\n\n` +
        (sessaoId ? '💡 Você pode CONTINUAR de onde parou clicando no botão "Continuar Processamento".' : '')
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

  // Filtrar
  const produtosFiltrados = filtro
    ? produtos.filter(p => Object.values(p).join(' ').toLowerCase().includes(filtro.toLowerCase()))
    : produtos;

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
    <LayoutAdmin titulo="Produtos" subtitulo="Cadastre manualmente ou cole sua lista e a IA extrai tudo automaticamente ✨">

      {/* 🔍 FILTRO + BOTÕES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '18px', height: '18px', color: '#888'
          }} />
          <input
            placeholder="Filtrar produtos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
              border: '1px solid #ddd', fontSize: '15px', outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = AZUL}
            onBlur={e => e.target.style.borderColor = '#ddd'}
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
              backgroundColor: '#8B5CF6', color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#7C3AED'}
            onMouseOut={e => e.target.style.backgroundColor = '#8B5CF6'}
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
              backgroundColor: AZUL, color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#2968D3'}
            onMouseOut={e => e.target.style.backgroundColor = AZUL}
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
              backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#047857'}
            onMouseOut={e => e.target.style.backgroundColor = '#059669'}
          >
            📊 Importar Preços
          </button>
        </div>
      </div>

      {/* 🤖 PROCESSADOR DE LISTA COM IA */}
      {mostrarProcessador && (
        <div style={{
          backgroundColor: '#FAF5FF', padding: '24px', borderRadius: '16px',
          border: '1px solid #EDE9FE', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#5B21B6' }}>
            ✨ Cole sua lista — a IA reconhece e preenche tudo!
          </h3>
          <p style={{ fontSize: '13px', color: '#7C3AED', margin: '0 0 16px 0' }}>
            Processa em lotes pequenos e salva cada um automaticamente. Se travar, é só continuar de onde parou! 🛡️
          </p>

          {/* 🆕 AVISO DE SESSÃO PENDENTE */}
          {temSessaoPendente && sessaoId && !processandoIa && (
            <div style={{
              backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
            }}>
              <div>
                <strong style={{ color: '#92400E', fontSize: '14px' }}>
                  ⚠️ Há um processamento inacabado!
                </strong>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                  Progresso: {progressoIa.atual}/{progressoIa.total} lotes | {progressoIa.produtosAcumulados} produtos salvos
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={continuarProcessamento}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', backgroundColor: '#F59E0B', color: 'white',
                    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                  Continuar Processamento
                </button>
                <button
                  onClick={cancelarSessao}
                  style={{
                    padding: '8px 12px', backgroundColor: 'transparent', color: '#92400E',
                    border: '1px solid #FCD34D', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
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
              border: '1px solid #C4B5FD', fontSize: '14px', fontFamily: 'monospace',
              outline: 'none', marginBottom: '14px', resize: 'vertical',
              opacity: processandoIa ? 0.6 : 1,
              backgroundColor: processandoIa ? '#F5F3FF' : 'white'
            }}
            onFocus={e => e.target.style.borderColor = '#8B5CF6'}
            onBlur={e => e.target.style.borderColor = '#C4B5FD'}
          />

          {processandoIa && (
            <div style={{ marginBottom: '14px', padding: '14px 16px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', fontSize: '13px', color: '#5B21B6', fontWeight: 600 }}>
                <span>{textoFase()}</span>
                <span>{progressoIa.percentual}%</span>
              </div>

              {/* Barra de progresso */}
              <div style={{ height: '12px', overflow: 'hidden', borderRadius: '999px', backgroundColor: '#EDE9FE', position: 'relative' }}>
                <div
                  style={{
                    width: `${progressoIa.percentual}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: progressoIa.fase === 'concluido'
                      ? 'linear-gradient(90deg, #10B981, #059669)'
                      : progressoIa.fase === 'parcial'
                        ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                        : 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '10px', fontSize: '12px', color: '#7C3AED', flexWrap: 'wrap' }}>
                <span>📦 Lotes: {progressoIa.atual}/{progressoIa.total}</span>
                <span>🛍️ Produtos: {progressoIa.produtosAcumulados}</span>
                <span>⏱️ Decorrido: {tempoDecorridoIa}s</span>
                {progressoIa.fase !== 'concluido' && progressoIa.tempoRestante > 0 && (
                  <span>⏳ Restante: ~{progressoIa.tempoRestante}s</span>
                )}
                {progressoIa.lotesFalhos > 0 && (
                  <span style={{ color: '#DC2626' }}>⚠️ Falhas: {progressoIa.lotesFalhos}</span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => processarListaComIa(false)}
            disabled={processandoIa}
            style={{
              padding: '12px 30px', backgroundColor: processandoIa ? '#C4B5FD' : '#8B5CF6',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px',
              fontWeight: 600, cursor: processandoIa ? 'wait' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => !processandoIa && (e.target.style.backgroundColor = '#7C3AED')}
            onMouseOut={e => !processandoIa && (e.target.style.backgroundColor = '#8B5CF6')}
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
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
          <div>
            <strong style={{ display: 'block', color: '#065F46', fontSize: '15px' }}>{selecionados.length} produto(s) selecionado(s)</strong>
            <span style={{ fontSize: '12px', color: '#047857' }}>Preço de venda = preço base + percentual + valor fixo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', color: '#065F46' }}>Percentual (%)<input type="number" min="0" step="0.1" value={percentualLote} onChange={e => setPercentualLote(e.target.value)} style={{ display: 'block', width: '105px', marginTop: '4px', padding: '9px 10px', border: '1px solid #A7F3D0', borderRadius: '8px', backgroundColor: 'white' }} /></label>
            <label style={{ fontSize: '12px', color: '#065F46' }}>Fixo (R$)<input type="number" min="0" step="0.01" value={valorFixoLote} onChange={e => setValorFixoLote(e.target.value)} style={{ display: 'block', width: '105px', marginTop: '4px', padding: '9px 10px', border: '1px solid #A7F3D0', borderRadius: '8px', backgroundColor: 'white' }} /></label>
            <button type="button" onClick={aplicarAjusteLote} disabled={ajustandoLote} style={{ padding: '10px 16px', backgroundColor: VERDE, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: ajustandoLote ? 'wait' : 'pointer' }}>{ajustandoLote ? 'Atualizando...' : 'Atualizar preços'}</button>
            <button type="button" onClick={excluirSelecionados} disabled={excluindoLote || ajustandoLote} style={{ padding: '10px 16px', backgroundColor: VERMELHO, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: excluindoLote ? 'wait' : 'pointer' }}>{excluindoLote ? 'Excluindo...' : 'Excluir selecionados'}</button>
            <button type="button" onClick={() => setSelecionados([])} style={{ padding: '10px 12px', backgroundColor: 'transparent', color: '#047857', border: '1px solid #A7F3D0', borderRadius: '8px', cursor: 'pointer' }}>Limpar</button>
          </div>
        </div>
      )}

      {/* 📝 FORMULÁRIO DE VÁRIOS PRODUTOS */}
      {!importadorAberto && mostrarForm && (
        <form onSubmit={salvarTodos} style={{
          backgroundColor: 'white', padding: '24px', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
            📦 Produtos prontos para cadastrar — {listaNovos.length} produto(s) na lista
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {listaNovos.map((produto, indice) => (
              <div key={indice} style={{
                border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px',
                backgroundColor: '#FAFAFA'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#444' }}>Produto #{indice + 1}</span>
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
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Nome *</label>
                    <input
                      required
                      placeholder="Nome do produto"
                      value={produto.nome}
                      onChange={e => alterarLinha(indice, 'nome', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Preço R$ *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produto.preco}
                      onChange={e => alterarLinha(indice, 'preco', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Seu Preço (opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produto.precoPersonalizado}
                      onChange={e => alterarLinha(indice, 'precoPersonalizado', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Categoria</label>
                    <input
                      placeholder="Ex: Eletrônicos"
                      value={produto.categoria}
                      onChange={e => alterarLinha(indice, 'categoria', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>URL da Imagem</label>
                    <input
                      placeholder="https://..."
                      value={produto.imagem}
                      onChange={e => alterarLinha(indice, 'imagem', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Descrição</label>
                    <textarea
                      placeholder="Descrição do produto"
                      value={produto.descricao}
                      onChange={e => alterarLinha(indice, 'descricao', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '60px' }}
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
              color: '#333', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%'
            }}
          >
            ➕ Adicionar Outro Produto na Lista
          </button>
          <button
            type="submit"
            disabled={salvando}
            style={{
              marginTop: '20px', padding: '14px', backgroundColor: salvando ? '#888' : VERDE,
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer',
              width: '100%', transition: 'background 0.2s'
            }}
            onMouseOver={e => !salvando && (e.target.style.backgroundColor = '#008C45')}
            onMouseOut={e => !salvando && (e.target.style.backgroundColor = VERDE)}
          >
            {salvando ? '⏳ Cadastrando...' : `💾 Salvar Todos os ${listaNovos.length} Produtos`}
          </button>
        </form>
      )}

      {/* ✏️ FORMULÁRIO DE EDIÇÃO INDIVIDUAL */}
      {editando && (
        <form onSubmit={salvarEdicao} style={{
          backgroundColor: 'white', padding: '24px', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>✏️ Editar Produto</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Nome *</label>
              <input
                required
                value={formEdicao.nome}
                onChange={e => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Preço Base R$ *</label>
              <input
                required type="number" step="0.01"
                value={formEdicao.preco}
                onChange={e => setFormEdicao({ ...formEdicao, preco: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Seu Preço R$</label>
              <input
                type="number" step="0.01"
                value={formEdicao.precoPersonalizado || ''}
                onChange={e => setFormEdicao({ ...formEdicao, precoPersonalizado: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Categoria</label>
              <input
                value={formEdicao.categoria}
                onChange={e => setFormEdicao({ ...formEdicao, categoria: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Imagem URL</label>
              <input
                value={formEdicao.imagem}
                onChange={e => setFormEdicao({ ...formEdicao, imagem: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Descrição</label>
              <textarea
                value={formEdicao.descricao}
                onChange={e => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px' }}
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
              style={{ padding: '12px 24px', backgroundColor: VERDE, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
            >
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* 📋 TABELA */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: AZUL, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '12px', color: '#666' }}>Carregando produtos...</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: CINZA }}>
                  {['', 'Foto', 'Produto', 'Preço custo', 'Preço venda', 'Categoria', 'Status', 'Ações'].map((h, i) => (
                    <th key={i} style={{
                      padding: '14px 16px', textAlign: i === 7 ? 'right' : 'left',
                      fontSize: '13px', fontWeight: 600, color: '#444', textTransform: 'uppercase'
                    }}>{i === 0 ? <input type="checkbox" checked={todosFiltradosSelecionados} onChange={e => selecionarFiltrados(e.target.checked)} aria-label="Selecionar todos os produtos filtrados" style={{ width: '17px', height: '17px', cursor: 'pointer' }} /> : i === 2 || i === 3 || i === 4 || i === 5 || i === 6 ? <button type="button" onClick={() => ordenarPor({ 2: 'nome', 3: 'preco', 4: 'precoPersonalizado', 5: 'categoria', 6: 'status' }[i])} style={{ border: 0, background: 'transparent', color: '#444', padding: 0, font: 'inherit', cursor: 'pointer' }}>{h} <span aria-hidden="true">{indicadorOrdenacao({ 2: 'nome', 3: 'preco', 4: 'precoPersonalizado', 5: 'categoria', 6: 'status' }[i])}</span></button> : h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : produtosOrdenados.map(p => {
                  const preco = p.precoPersonalizado || calcularPrecoVendaPadrao(p.preco) || p.preco;
                  return (
                    <tr key={p._id} style={{ borderTop: '1px solid #f0f0f0', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}><input type="checkbox" checked={selecionados.includes(p._id)} onChange={() => alternarSelecao(p._id)} aria-label={`Selecionar ${p.nome}`} style={{ width: '17px', height: '17px', cursor: 'pointer' }} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.imagem ? (
                          <img src={p.imagem} alt={p.nome} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#f8f8f8' }} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/LogoEscrthinny.jpg'; }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.nome}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {precoEmEdicao?.id === p._id && precoEmEdicao.campo === 'preco' ? <input autoFocus type="number" min="0.01" step="0.01" value={valorPrecoEdicao} onChange={e => setValorPrecoEdicao(e.target.value)} onKeyDown={tratarTeclaPreco} onBlur={salvarPrecoInline} disabled={salvandoPreco} style={{ width: '110px', padding: '7px 8px', border: `1px solid ${AZUL}`, borderRadius: '7px' }} /> : <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span><button type="button" onClick={() => iniciarEdicaoPreco(p, 'preco')} title="Editar preço de custo" aria-label="Editar preço de custo" style={{ border: 0, background: 'transparent', color: AZUL, cursor: 'pointer', padding: '3px' }}><PencilIcon style={{ width: '14px', height: '14px' }} /></button></div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {precoEmEdicao?.id === p._id && precoEmEdicao.campo === 'precoPersonalizado' ? <input autoFocus type="number" min="0.01" step="0.01" value={valorPrecoEdicao} onChange={e => setValorPrecoEdicao(e.target.value)} onKeyDown={tratarTeclaPreco} onBlur={salvarPrecoInline} disabled={salvandoPreco} style={{ width: '110px', padding: '7px 8px', border: `1px solid ${VERDE}`, borderRadius: '7px' }} /> : <div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '15px', color: VERDE }}><span>R$ {Number(preco).toFixed(2).replace('.', ',')}</span><button type="button" onClick={() => iniciarEdicaoPreco(p, 'precoPersonalizado')} title="Editar preço de venda" aria-label="Editar preço de venda" style={{ border: 0, background: 'transparent', color: VERDE, cursor: 'pointer', padding: '3px' }}><PencilIcon style={{ width: '14px', height: '14px' }} /></button></div>{p.precoPersonalizado && <div style={{ fontSize: '12px', color: '#999' }}>Calculado/manual</div>}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{p.categoria || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: p.disponivel ? `${VERDE}15` : `${VERMELHO}15`,
                          color: p.disponivel ? VERDE : VERMELHO
                        }}>
                          {p.disponivel ? '✅ Ativo' : '⏸️ Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => editar(p)} style={{
                          padding: '6px 10px', border: 'none', background: `${AZUL}10`,
                          color: AZUL, borderRadius: '8px', marginRight: '6px', cursor: 'pointer'
                        }} title="Editar">
                          <PencilIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button onClick={() => deletar(p._id)} style={{
                          padding: '6px 10px', border: 'none', background: `${VERMELHO}10`,
                          color: VERMELHO, borderRadius: '8px', cursor: 'pointer'
                        }} title="Excluir">
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
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
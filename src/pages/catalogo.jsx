import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useCarrinho } from '../context/carrinho';
import Carrinho from '../components/carrinho';
import FiltrosCatalogo from '../components/FiltrosCatalogo';
import { moeda } from '../utils/variantes';

const IMAGENS_FALLBACK = {
  'iPhones Lacrados': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
  'iPhones CPO': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
  'Apple Watch': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
  'Garmin': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
  'Fitbit': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
  'iPads': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
  'MacBook': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
  'AirPods': 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
};

const resolverUrlImagem = (src, categoria = '') => {
  const valor = String(src || '').trim();
  if (!valor) return IMAGENS_FALLBACK[categoria] || IMAGENS_FALLBACK.default;

  const url = valor.startsWith('//') ? `https:${valor}` : valor;
  if (!/^https?:\/\//i.test(url)) return IMAGENS_FALLBACK[categoria] || IMAGENS_FALLBACK.default;

  if (!/\.(jpeg|jpg|png|webp|gif|avif|svg)(\?.*)?$/i.test(url)) {
    return IMAGENS_FALLBACK[categoria] || IMAGENS_FALLBACK.default;
  }

  return url;
};

const renderImagemProduto = (src, alt, categoria = '', estilo = {}) => {
  const urlInicial = resolverUrlImagem(src, categoria);

  return (
    <img
      src={urlInicial}
      alt={alt}
      style={{
        maxHeight: '180px',
        maxWidth: '100%',
        objectFit: 'contain',
        ...estilo
      }}
      onError={e => {
        const fallback = IMAGENS_FALLBACK[categoria] || IMAGENS_FALLBACK.default;
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallback;
        }
      }}
    />
  );
};

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [params, setParams] = useSearchParams();
  const [opcoes, setOpcoes] = useState({});
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const { itens } = useCarrinho();
  const query = params.toString();
  const busca = params.get('busca') || '';
  const filtros = Object.fromEntries(params);

  useEffect(() => {
    const controle = new AbortController();
    const configuracao = { params: Object.fromEntries(new URLSearchParams(query)), signal: controle.signal };
    Promise.all([api.get('/produtos', configuracao), api.get('/filtros', configuracao)])
      .then(([catalogo, filtrosDisponiveis]) => {
        setProdutos(catalogo.data);
        setOpcoes(filtrosDisponiveis.data);
        setErro('');
      })
      .catch(error => { if (!controle.signal.aborted) setErro(error.response?.data?.error || 'Não foi possível carregar o catálogo. Tente novamente.'); })
      .finally(() => { if (!controle.signal.aborted) setLoading(false); });
    return () => controle.abort();
  }, [query]);

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);
  const filtrados = produtos;
  const limparFiltros = () => { if (!query) return; setLoading(true); setParams({}, { replace: true }); };

  const atualizarFiltro = (campo, valor) => {
    const ordem = ['marca', 'categoria', 'modelo', 'cor', 'capacidade'];
    const novos = new URLSearchParams(params);
    ordem.slice(ordem.indexOf(campo) + 1).forEach(descendente => novos.delete(descendente));
    if (valor) novos.set(campo, valor); else novos.delete(campo);
    setLoading(true);
    setParams(novos, { replace: true });
  };

  const atualizarBusca = (valor) => {
    const novos = new URLSearchParams(params);
    if (valor) novos.set('busca', valor); else novos.delete('busca');
    setLoading(true);
    setParams(novos, { replace: true });
  };

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f7f7f3' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        :root {
          --bg: #080808;
          --bg-soft: #0f0f0f;
          --panel: #101010;
          --panel-strong: #171717;
          --line: rgba(255,255,255,0.08);
          --muted: #a4a39d;
          --text: #f7f7f3;
          --gold: #f5a400;
          --gold-soft: #ffca56;
          --shadow: rgba(0,0,0,0.38);
        }

        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: var(--bg); }
        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        svg { max-width: none !important; max-height: none !important; }

        .header-placetech {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(8,8,8,0.82);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--line);
        }

        .wrap, .catalog-wrap, .foot {
          width: min(1200px, calc(100% - 40px));
          margin: 0 auto;
        }

        .header-inner {
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-weight: 900;
          letter-spacing: -0.7px;
          font-size: 20px;
        }

        .mark {
          width: 34px;
          height: 34px;
          border: 8px solid var(--gold);
          border-radius: 50% 50% 50% 12px;
          transform: rotate(-45deg);
          position: relative;
          display: inline-block;
        }

        .mark:after {
          content: '';
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: var(--bg);
        }

        .brand em { font-style: normal; color: var(--gold); }

        .navlinks {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #d9d8d4;
          font-size: 14px;
        }

        .navlinks a {
          opacity: 0.86;
          transition: opacity 0.2s ease;
        }

        .navlinks a:hover { opacity: 1; }

        .navcta, .primary, .secondary {
          border-radius: 999px;
          font-weight: 800;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }

        .navcta, .primary {
          background: linear-gradient(180deg, var(--gold) 0%, #e89d00 100%);
          color: #111;
          box-shadow: 0 10px 25px rgba(245,164,0,0.25);
          border: 0;
          cursor: pointer;
        }

        .navcta {
          padding: 12px 18px;
          white-space: nowrap;
        }

        .primary {
          padding: 14px 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 200px;
        }

        .navcta:hover, .primary:hover, .secondary:hover {
          transform: translateY(-2px);
          filter: brightness(1.02);
        }

        .hero {
          position: relative;
          min-height: 640px;
          display: flex;
          align-items: center;
          background: linear-gradient(90deg, rgba(6,6,6,0.97) 0%, rgba(6,6,6,0.92) 35%, rgba(6,6,6,0.20) 68%), url('https://catalogo-placetech.diego-placetech.chatgpt.site/assets/hero-smartphones.png') center/cover no-repeat;
          border-bottom: 1px solid var(--line);
          overflow: hidden;
        }

        .hero:before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(245,164,0,0.18), transparent 28%);
          pointer-events: none;
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 640px;
          padding: 90px 0;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border: 1px solid rgba(245,164,0,0.25);
          border-radius: 999px;
          background: rgba(245,164,0,0.08);
          color: var(--gold-soft);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .hero-badge:before {
          content: '';
          width: 20px;
          height: 2px;
          background: var(--gold);
          border-radius: 999px;
        }

        .hero h1 {
          font-size: clamp(46px, 6vw, 82px);
          line-height: 0.94;
          letter-spacing: -4px;
          margin: 24px 0 22px;
          color: var(--text);
        }

        .hero p {
          font-size: 18px;
          line-height: 1.6;
          color: #d1d0cb;
          max-width: 560px;
          margin: 0;
        }

        .actions {
          display: flex;
          gap: 14px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .secondary {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.18);
          color: var(--text);
          padding: 13px 22px;
          cursor: pointer;
        }

        .trust {
          display: flex;
          gap: 24px;
          margin-top: 42px;
          flex-wrap: wrap;
          color: #bdb9b0;
          font-size: 13px;
        }

        .trust span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .trust i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 16px rgba(245,164,0,0.8);
          display: inline-block;
        }

        .hero-stats {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .hero-stat {
          min-width: 150px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
        }

        .hero-stat strong {
          display: block;
          color: var(--gold-soft);
          font-size: 22px;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .hero-stat span {
          display: block;
          margin-top: 4px;
          color: #d0cdc6;
          font-size: 12px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        section { padding: 92px 0; }

        .section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .section-head h2 {
          margin: 12px 0 0;
          font-size: clamp(32px, 5vw, 56px);
          line-height: 1.05;
          letter-spacing: -2.5px;
          color: var(--text);
        }

        .section-head p {
          max-width: 500px;
          margin: 0;
          color: var(--muted);
          line-height: 1.6;
        }

        .controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .search {
          flex: 1;
          min-width: 240px;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.02);
          color: var(--text);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search::placeholder { color: #8a8a84; }
        .search:focus {
          border-color: rgba(245,164,0,0.8);
          box-shadow: 0 0 0 4px rgba(245,164,0,0.12);
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter {
          padding: 12px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--line);
          color: #d9d8d4;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter.active {
          background: linear-gradient(180deg, var(--gold) 0%, #e89d00 100%);
          border-color: var(--gold);
          color: #111;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(245,164,0,0.22);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .card {
          position: relative;
          overflow: hidden;
          border-radius: 26px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(23,23,23,0.94), rgba(13,13,13,0.94));
          padding: 24px;
          min-height: 390px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.24);
          transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
        }

        .card:hover {
          transform: translateY(-5px);
          border-color: rgba(245,164,0,0.5);
          box-shadow: 0 20px 70px rgba(0,0,0,0.35);
        }

        .card:before {
          content: '';
          position: absolute;
          width: 180px;
          height: 180px;
          right: -60px;
          top: -60px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,164,0,0.14), transparent 68%);
        }

        .badge {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-self: flex-start;
          padding: 7px 10px;
          border-radius: 9px;
          border: 1px solid rgba(245,164,0,0.22);
          background: rgba(245,164,0,0.08);
          color: var(--gold-soft);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .img-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 190px;
          margin-top: 18px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          padding: 12px;
        }

        .card h3 {
          position: relative;
          z-index: 1;
          margin: 18px 0 8px;
          font-size: 26px;
          letter-spacing: -1px;
          line-height: 1.12;
          color: var(--text);
        }

        .price-box {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
        }

        .price-box strong {
          display: block;
          font-size: 18px;
          letter-spacing: -0.8px;
          color: var(--text);
        }

        .price-box .valor {
          font-size: 28px;
          letter-spacing: -1.5px;
          font-weight: 800;
          color: var(--gold-soft);
        }

        .price-box .parcelas {
          color: #b9b7b2;
          font-size: 12px;
        }

        .family {
          position: relative;
          z-index: 1;
          color: var(--muted);
          font-size: 13px;
        }

        .specs {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 18px 0 20px;
        }

        .specs span {
          padding: 7px 9px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          color: #d8d5cf;
          font-size: 11px;
        }

        .card-foot {
          position: relative;
          z-index: 1;
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .availability {
          display: block;
          font-size: 12px;
          color: #b0adab;
          line-height: 1.4;
        }

        .availability b {
          display: block;
          font-size: 13px;
          color: var(--text);
        }

        .ask {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(245,164,0,0.3);
          background: rgba(245,164,0,0.06);
          color: var(--gold-soft);
          font-weight: 800;
          cursor: pointer;
        }

        .empty {
          text-align: center;
          padding: 70px 20px;
          border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 22px;
          color: var(--muted);
          margin-top: 18px;
          display: none;
        }

        .why {
          background: #0d0d0d;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .benefit {
          padding: 26px 22px;
          border-left: 2px solid var(--gold);
          background: rgba(255,255,255,0.02);
        }

        .benefit b {
          display: block;
          margin-bottom: 8px;
          font-size: 18px;
          color: var(--text);
        }

        .benefit span {
          color: var(--muted);
          line-height: 1.6;
          font-size: 14px;
        }

        .cta-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 52px 56px;
          border-radius: 34px;
          background: linear-gradient(115deg, #f0a000 0%, #ffc44a 100%);
          color: #111;
          box-shadow: 0 18px 48px rgba(240,160,0,0.18);
        }

        .cta-panel h2 {
          margin: 0 0 12px;
          font-size: clamp(30px, 5vw, 52px);
          letter-spacing: -2px;
          line-height: 1;
        }

        .cta-panel p {
          max-width: 620px;
          margin: 0;
          color: rgba(17,17,17,0.76);
          line-height: 1.6;
        }

        .cta-panel .secondary {
          background: rgba(17,17,17,0.04);
          border: 1px solid rgba(17,17,17,0.7);
          color: #111;
          padding: 14px 24px;
          white-space: nowrap;
        }

        footer {
          padding: 44px 0 48px;
          background: #0b0b0b;
          border-top: 1px solid var(--line);
        }

        .foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .foot small {
          display: block;
          margin-top: 10px;
          color: #9d9b96;
        }

        .contact {
          text-align: right;
          color: #b3b0aa;
          font-size: 13px;
          line-height: 1.8;
        }

        @media (max-width: 900px) {
          .navlinks a:not(.navcta):not(.nav-troca) { display: none; }
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .benefits { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .section-head, .cta-panel, .foot { flex-direction: column; align-items: flex-start; }
          .contact { text-align: left; }
        }

        @media (max-width: 620px) {
          .wrap, .catalog-wrap, .foot { width: min(100% - 28px, 1200px); }
          .header-inner { height: 72px; }
          .brand { font-size: 18px; }
          .mark { width: 28px; height: 28px; border-width: 7px; }
          .navcta { padding: 10px 16px; font-size: 12px; }
          .header-inner { height: auto; min-height: 72px; flex-wrap: wrap; padding: 14px 0; gap: 12px; }
          .navlinks { flex-wrap: wrap; gap: 12px; font-size: 12px; }
          .hero { min-height: 620px; background: linear-gradient(180deg, rgba(5,5,5,.38), rgba(5,5,5,.96) 56%), url('https://catalogo-placetech.diego-placetech.chatgpt.site/assets/hero-smartphones.png') 70% top/auto 58% no-repeat; }
          .hero-inner { padding-top: 250px; }
          .actions { flex-direction: column; align-items: stretch; }
          .primary, .secondary { width: 100%; }
          .grid { grid-template-columns: 1fr; }
          .benefits { grid-template-columns: 1fr; }
          .filters { overflow: auto; }
          .filter { flex: 0 0 auto; }
          .section-head { margin-bottom: 18px; }
        }
      `}</style>

      <header className="header-placetech">
        <div className="wrap header-inner">
          <a className="brand" href="#">
            <span className="mark" />
            <span><em>place</em>tech</span>
          </a>

          <div className="navlinks">
            <a href="#catalogo">Catálogo</a>
            <Link className="nav-troca" to="/troca">Trocar meu aparelho</Link>
            <a href="#vantagens">Por que a Placetech</a>
            <button className="navcta" onClick={() => setCarrinhoAberto(true)}>
              {totalItens > 0 ? `Meu carrinho (${totalItens})` : 'Meu carrinho'}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <div className="hero-inner">
              <span className="hero-badge">Seleção premium</span>
              <h1>Tecnologia à altura das suas escolhas.</h1>
              <p>iPhones e Xiaomi selecionados para quem exige desempenho, procedência e atendimento de verdade.</p>

              <div className="actions">
                <a className="primary" href="#catalogo">Explorar aparelhos</a>
                <Link className="secondary" to="/troca">Trocar meu aparelho</Link>
                <button className="secondary" onClick={() => setCarrinhoAberto(true)}>Ver carrinho</button>
              </div>

              <div className="trust">
                <span><i></i>Atendimento especializado</span>
                <span><i></i>Envio nacional</span>
                <span><i></i>Garantia e suporte</span>
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <strong>+1.500</strong>
                  <span>aparelhos vendidos</span>
                </div>
                <div className="hero-stat">
                  <strong>4.9/5</strong>
                  <span>avaliação média</span>
                </div>
                <div className="hero-stat">
                  <strong>24h</strong>
                  <span>atendimento rápido</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogo">
          <div className="catalog-wrap">
            <div className="section-head">
              <div>
                <span className="hero-badge">Catálogo 2026</span>
                <h2>Encontre o seu próximo smartphone.</h2>
              </div>
              <p>Modelos organizados a partir das linhas atuais comercializadas no Brasil e no Paraguai. Consulte disponibilidade, memória, cor e valor atualizado.</p>
            </div>

            <div className="controls">
              <input
                className="search"
                value={busca}
                onChange={(e) => atualizarBusca(e.target.value)}
                aria-label="Buscar aparelho"
                placeholder="Buscar por modelo, linha ou memória..."
              />

              <FiltrosCatalogo filtros={filtros} opcoes={opcoes} onChange={atualizarFiltro} onLimpar={limparFiltros} />
            </div>

            {(loading || erro) && <p className="variant-status" role="status">{erro || 'Carregando modelos...'}</p>}
            <div className="grid">
              {!loading && !erro && filtrados.length > 0 ? filtrados.map((prod) => {
                const precoExib = prod.precoAPartir;
                const badge = prod.categoria || 'Destaque';
                const specs = [
                  prod.marca,
                  `${prod.cores.length} cor(es)`,
                  prod.capacidades.join(' · ')
                ].filter(Boolean);
                const detalhe = `/produto/${prod._id}${query ? `?${query}` : ''}`;

                return (
                  <article className="card" key={prod._id || prod.nome}>
                    <span className="badge">{badge}</span>
                    <Link to={detalhe} className="variant-card-link" aria-label={`Ver variantes de ${prod.nome}`}>
                    <div className="img-wrap">
                      {renderImagemProduto(prod.imagem, prod.nome, prod.categoria, { height: '180px', width: '100%' })}
                    </div>
                    <h3>{prod.nome}</h3>
                    </Link>
                    <span className="family">{prod.descricao || 'Produto selecionado com garantia e suporte'}</span>
                    <div className="specs">
                      {specs.slice(0, 3).map((item, idx) => (
                        <span key={`${prod._id || prod.nome}-${idx}`}>{item}</span>
                      ))}
                    </div>
                    <div className="price-box">
                      <div>
                        <strong>A partir de</strong>
                        <div className="valor">{moeda(precoExib)}</div>
                      </div>
                      <div className="parcelas">até 10x</div>
                    </div>

                    <div className="card-foot">
                      <span className="availability">
                        <b>{prod.sobEncomenda ? 'Sob encomenda' : 'Disponível em estoque'}</b>
                        Atendimento especializado
                      </span>
                      <Link className="ask" to={detalhe}>Escolher →</Link>
                    </div>
                  </article>
                );
              }) : null}
            </div>

            <div className="empty" style={{ display: !loading && !erro && filtrados.length === 0 ? 'block' : 'none' }}>
              Nenhum aparelho encontrado. Tente outro termo.
            </div>
          </div>
        </section>

        <section className="why" id="vantagens">
          <div className="catalog-wrap">
            <div className="section-head">
              <div>
                <span className="hero-badge">Compra segura</span>
                <h2>Mais que um aparelho.</h2>
              </div>
              <p>Uma experiência de compra com orientação técnica do primeiro contato ao pós-venda.</p>
            </div>

            <div className="benefits">
              <div className="benefit"><b>Procedência</b><span>Produtos selecionados e informações transparentes.</span></div>
              <div className="benefit"><b>Garantia</b><span>Segurança e suporte especializado após a compra.</span></div>
              <div className="benefit"><b>Atendimento humano</b><span>Recomendação conforme seu uso e investimento.</span></div>
              <div className="benefit"><b>Entrega nacional</b><span>Logística para atender clientes em todo o Brasil.</span></div>
            </div>
          </div>
        </section>

        <section>
          <div className="catalog-wrap">
            <div className="cta-panel">
              <div>
                <h2>Qual modelo combina com você?</h2>
                <p>Fale com nossa equipe e receba uma recomendação personalizada, com condição atualizada e disponibilidade em tempo real.</p>
              </div>
              <button className="secondary" onClick={() => setCarrinhoAberto(true)}>Consultar especialista →</button>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="foot">
          <div>
            <a className="brand" href="#">
              <span className="mark" />
              <span><em>place</em>tech</span>
            </a>
            <small>Soluções em Tecnologia · Lindóia — SP</small>
          </div>

          <div className="contact">(19) 3898-3284 · @placetechh<br />contato@placetech.com.br · www.placetech.com.br</div>
        </div>
      </footer>

      <Carrinho aberto={carrinhoAberto} fechar={() => setCarrinhoAberto(false)} />
    </div>
  );
}

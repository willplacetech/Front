import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SiteHeader from '../components/SiteHeader';
import './Catalogo.css';
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
    <div className="catalog-page">


      <SiteHeader onCarrinho={() => setCarrinhoAberto(true)} />

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
                <Link className="secondary" to="/comparar">Comparar aparelhos</Link>
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
                      {renderImagemProduto(prod.variants?.flatMap(variante => variante.imagens || [])[0] || prod.imagem || prod.galeria?.[0],
                        prod.nome, prod.categoria, { height: '180px', width: '100%' })}
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

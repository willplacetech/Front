import { useEffect, useState } from 'react';
import api from '../services/api';
import { useCarrinho } from '../context/CarrinhoContext';
import Carrinho from '../components/Carrinho';
import {
  ShoppingCartIcon, MagnifyingGlassIcon,
  MapPinIcon, UserIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';
import LogoPlacetech from '../components/logocss';

// CORES OFICIAIS PLACETECH
const AMARELO = '#F9D828';
const PRETO = '#000000';
const AZUL = '#3483FA';
const VERDE = '#00A650';
const FUNDO = '#EBEBEB';

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const { itens, adicionar } = useCarrinho();

  useEffect(() => {
    setLoading(true);
    api.get('/produtos/disponiveis')
      .then(r => setProdutos(r.data))
      .finally(() => setLoading(false));
  }, []);

  const categorias = ['todas', ...new Set(produtos.map(p => p.categoria).filter(Boolean))];
  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);

  const filtrados = produtos.filter(p => {
    const termo = buscaAtiva.toLowerCase().trim();
    const matchBusca = termo === '' ||
      p.nome.toLowerCase().includes(termo) ||
      (p.descricao && p.descricao.toLowerCase().includes(termo));
    const matchCat = categoria === 'todas' || p.categoria === categoria;
    return matchBusca && matchCat;
  });

  const executarBusca = (e) => { e.preventDefault(); setBuscaAtiva(busca); };
  const limparFiltros = () => { setBusca(''); setBuscaAtiva(''); setCategoria('todas'); };

  return (
    <div style={{backgroundColor: FUNDO, minHeight: '100vh'}}>
      {/* ✅ Bootstrap MANTIDO */}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        * { font-family: 'Roboto', -apple-system, sans-serif; }

        /* ✅ CORRIGE ÍCONES SVG que estavam minúsculos */
        svg { max-width: none !important; max-height: none !important; }

        /* HEADER */
        .header-placetech { background-color: ${AMARELO}; }

        /* CARD PRODUTO */
        .card-produto { 
          border: none; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden;
        }
        .card-produto:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }

        /* BOTÃO PADRÃO */
        .btn-placetech { 
          background-color: ${AZUL}; color: white; border-radius: 8px;
          font-weight: 500; padding: 10px; width: 100%; border: none;
        }
        .btn-placetech:hover { background-color: #2968D3; color: white; }

        /* CATEGORIAS */
        .cat-btn { 
          border-radius: 20px; padding: 6px 16px; border: 1px solid #ddd;
          background: white; font-size: 14px; transition: all 0.2s;
        }
        .cat-btn.ativo { background-color: ${PRETO}; color: white; border-color: ${PRETO}; }
        .cat-btn:hover:not(.ativo) { border-color: ${AZUL}; color: ${AZUL}; }

        /* PREÇO */
        .preco-principal { font-size: 28px; font-weight: 700; line-height: 1; }
        .preco-de { font-size: 14px; color: #999; text-decoration: line-through; }
        .parcelamento { font-size: 13px; color: ${VERDE}; }
        .frete-texto { font-size: 13px; color: ${VERDE}; font-weight: 500; }
      `}</style>

      {/* ========================================== */}
      {/* 🔝 HEADER — BEM ALINHADO */}
      {/* ========================================== */}
      <header className="header-placetech sticky-top shadow-sm">
        <div className="container py-3">
          <div className="row align-items-center g-3">
            
            {/* LOGO */}
            <div className="col-auto">
              <a href="/LogoEscrthinny.jpg" className="text-decoration-none">
                <img src="/LogoEscrthinny.jpg" alt="Placetech" style={{height: '50px'}} />
              </a>
            </div>

            {/* BUSCA — CENTRALIZADA E BEM POSICIONADA */}
            <div className="col-md col-12">
              <form onSubmit={executarBusca} className="position-relative">
                <MagnifyingGlassIcon style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  width: '18px', height: '18px', color: '#888', zIndex: 10
                }} />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="form-control rounded-pill border-0 shadow-sm"
                  style={{height: '44px', paddingLeft: '44px', fontSize: '15px'}}
                />
              </form>
            </div>

            {/* AÇÕES */}
            <div className="col-auto d-none d-md-flex align-items-center gap-3">
              <span className="d-flex align-items-center gap-1 small">
                <MapPinIcon style={{width: '16px', height: '16px'}} />
                <span className="fw-medium">Lindoia - SP</span>
              </span>
              
              <button 
                onClick={() => setCarrinhoAberto(true)}
                className="btn position-relative p-1"
              >
                <ShoppingCartIcon style={{width: '24px', height: '24px'}} />
                {totalItens > 0 && (
                  <span className="badge bg-dark rounded-pill position-absolute top-0 start-100 translate-middle" style={{fontSize: '10px', padding: '2px 6px'}}>
                    {totalItens}
                  </span>
                )}
              </button>
            </div>

            {/* MENU MOBILE */}
            <div className="col-auto d-md-none">
              <button onClick={() => setMenuAberto(!menuAberto)} className="btn p-0">
                {menuAberto ? <XMarkIcon style={{width: '24px', height: '24px'}} /> : <Bars3Icon style={{width: '24px', height: '24px'}} />}
              </button>
            </div>
          </div>

          {menuAberto && (
            <div className="d-md-none pt-3 border-top mt-2">
              <div className="d-flex flex-column gap-2">
                <span className="d-flex align-items-center gap-2 small">
                  <MapPinIcon style={{width: '16px', height: '16px'}} /> Lindoia - SP
                </span>
                <a href="/loja" className="text-dark text-decoration-none small fw-medium">Área Administrativa</a>
                <button 
                  onClick={() => { setCarrinhoAberto(true); setMenuAberto(false); }}
                  className="btn btn-dark btn-sm"
                >
                  🛒 Meu Carrinho ({totalItens})
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ========================================== */}
      {/* 📂 CATEGORIAS */}
      {/* ========================================== */}
      <section className="bg-white border-bottom py-2">
        <div className="container">
          <div className="d-flex gap-2 flex-wrap">
            <button 
              onClick={limparFiltros}
              className={`cat-btn ${categoria === 'todas' ? 'ativo' : ''}`}
            >
              Todos os Produtos
            </button>
            {categorias.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoria(cat); setBuscaAtiva(''); }}
                className={`cat-btn ${categoria === cat ? 'ativo' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 📢 BANNER */}
      {/* ========================================== */}
      <section className="bg-dark text-white py-4 my-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="h5 fw-bold mb-1">As melhores ofertas da região!</h2>
              <p className="opacity-75 mb-0 small">Produtos com qualidade e entrega rápida em Lindoia e região</p>
            </div>
            <div className="col-md-4 text-md-end mt-2">
              <span className="badge px-3 py-2" style={{backgroundColor: AMARELO, color: PRETO, fontSize: '14px', fontWeight: 600}}>
                ⚡ Entrega em até 24h*
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 📦 PRODUTOS */}
      {/* ========================================== */}
      <main className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">
            {buscaAtiva ? `Resultados para: "${buscaAtiva}"` : 
             categoria !== 'todas' ? categoria : 'Produtos em Destaque'}
            <span className="text-muted fw-normal ms-2">({filtrados.length} itens)</span>
          </h5>
          {(buscaAtiva || categoria !== 'todas') && (
            <button onClick={limparFiltros} className="btn btn-sm btn-outline-secondary">Limpar filtros</button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{color: AZUL}} />
            <p className="mt-3 text-muted">Carregando produtos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 shadow-sm">
            <p className="fs-2 mb-2">🔍</p>
            <h5 className="fw-bold">Nenhum produto encontrado</h5>
            <p className="text-muted">Tente buscar por outro termo ou categoria</p>
            <button onClick={limparFiltros} className="btn btn-placetech mt-2">Ver todos os produtos</button>
          </div>
        ) : (
          <div className="row g-4">
            {filtrados.map(prod => {
              const precoExib = prod.precoExibicao || prod.preco;
              const temDesconto = prod.precoPersonalizado && prod.precoPersonalizado < prod.preco;
              const parcela = (precoExib / 10).toFixed(2);

              return (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={prod._id}>
                  <div className="card card-produto h-100">
                    {/* IMAGEM */}
                    <div className="p-3 d-flex align-items-center justify-content-center bg-white" style={{height: '200px'}}>
                      <img
                        src={prod.imagem || 'https://placehold.co/300x300/EBEBEB/999?text=Produto'}
                        alt={prod.nome}
                        style={{maxHeight: '180px', maxWidth: '100%', objectFit: 'contain'}}
                        onError={e => e.currentTarget.src='https://placehold.co/300x300/EBEBEB/999?text=Imagem+indisponível'}
                      />
                    </div>

                    {/* CONTEÚDO */}
                    <div className="p-3">
                      {/* PREÇO */}
                      {temDesconto && <p className="preco-de mb-1">De R$ {Number(prod.preco).toFixed(2)}</p>}
                      <p className="preco-principal mb-1">
                        R$ {Number(precoExib).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="parcelamento mb-1">em até 10x de R$ {parcela.replace('.', ',')}</p>
                      <p className="frete-texto mb-2">🚚 Entrega grátis</p>

                      {/* NOME */}
                      <h3 className="h6 fw-normal text-dark mb-3" style={{fontSize: '14px', lineHeight: '1.3', height: '36px', overflow: 'hidden'}}>
                        {prod.nome}
                      </h3>

                      {/* BOTÃO */}
                      <button
                        onClick={() => adicionar(prod)}
                        className="btn btn-placetech"
                      >
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* 🦶 RODAPÉ */}
      {/* ========================================== */}
           {/* ========================================== */}
      {/* 🦶 RODAPÉ CORRIGIDO */}
      {/* ========================================== */}
      <footer style={{backgroundColor: '#1A1A1A', color: 'white', padding: '32px 0', marginTop: 'auto'}}>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4 text-center text-md-start">
              <h5 style={{fontWeight: 700, marginBottom: '8px', color: AMARELO, fontSize: '22px'}}>Placetech</h5>
              <p style={{fontSize: '14px', color: '#AAA', margin: 0}}>
                Loja oficial da Placetech Lindoia<br />
                Qualidade e confiança em cada produto
              </p>
            </div>
            <div className="col-md-4 text-center">
              <h6 style={{fontWeight: 600, marginBottom: '12px', fontSize: '16px'}}>Contato</h6>
              <p style={{fontSize: '14px', color: '#AAA', margin: '4px 0'}}>
                📍 Lindoia - São Paulo
              </p>
              <p style={{fontSize: '14px', color: '#AAA', margin: '4px 0'}}>
                📧 atendimento@placetech.com.br
              </p>
            </div>
            <div className="col-md-4 text-center text-md-end">
              <h6 style={{fontWeight: 600, marginBottom: '12px', fontSize: '16px'}}>Segurança</h6>
              <p style={{fontSize: '14px', color: '#AAA', margin: '4px 0'}}>✅ Seus dados protegidos</p>
              <p style={{fontSize: '14px', color: '#AAA', margin: '4px 0'}}>🔒 Pagamento seguro</p>
            </div>
          </div>
          <div style={{borderTop: '1px solid #333', marginTop: '20px', paddingTop: '16px', textAlign: 'center', fontSize: '13px', color: '#777'}}>
            © {new Date().getFullYear()} Placetech Lindoia — Todos os direitos reservados
          </div>
        </div>
      </footer>

      {/* 🛒 CARRINHO */}
      <Carrinho aberto={carrinhoAberto} fechar={() => setCarrinhoAberto(false)} />
    </div>
  );
}
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useCarrinho } from '../context/CarrinhoContext';
import Carrinho from '../components/Carrinho';
import {
  ShoppingCartIcon, MagnifyingGlassIcon,
  MapPinIcon, ChevronDownIcon, HeartIcon,
  UserIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';

// CORES PLACETECH
const AMARELO = '#F9D828';
const PRETO = '#000000';
const AZUL = '#3483FA';
const VERDE = '#00A650';

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
    <div className="min-h-screen bg-[#EBEBEB] text-[#333]">
      {/* Bootstrap CDN carregado uma vez */}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        * { font-family: 'Roboto', -apple-system, sans-serif; }
        .bg-placetech-yellow { background-color: ${AMARELO}; }
        .text-placetech-yellow { color: ${AMARELO}; }
        .border-placetech-yellow { border-color: ${AMARELO}; }
        .btn-placetech { background-color: ${AZUL}; color: white; font-weight: 500; }
        .btn-placetech:hover { background-color: #2968D3; color: white; }
        .card-produto { transition: all 0.25s ease; }
        .card-produto:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .preco-grande { font-size: 22px; font-weight: 600; line-height: 1.2; }
        .centavos { font-size: 11px; vertical-align: super; }
        .frete-gratis { color: ${VERDE}; font-weight: 500; font-size: 13px; }
        .categorias-bar { background-color: white; border-bottom: 1px solid #eee; }
      `}</style>

      {/* ========================================== */}
      {/* 🔝 TOPO — BARRA AMARELA FIXA */}
      {/* ========================================== */}
      <header className="bg-placetech-yellow py-3 sticky-top shadow-sm">
        <div className="container">
          <div className="row align-items-center g-2">
            
            {/* LOGO */}
            <div className="col-auto">
              <a href="/" className="d-flex align-items-center text-decoration-none">
                <img src="https://i.imgur.com/9Z7Q8xL.png" alt="Placetech" style={{height: '42px'}} className="me-2" />
              </a>
            </div>

            {/* BARRA DE BUSCA */}
            <div className="col-md-6 col-12">
              <form onSubmit={executarBusca} className="position-relative">
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="form-control form-control-lg border-0 rounded-pill shadow-sm ps-4 pe-5"
                  style={{height: '44px'}}
                />
                <button type="submit" className="btn position-absolute top-0 end-0 h-100 me-1 px-3 text-dark">
                  <MagnifyingGlassIcon style={{width: '20px', height: '20px'}} />
                </button>
              </form>
            </div>

            {/* AÇÕES — DESKTOP */}
            <div className="col-auto d-none d-md-flex align-items-center gap-4">
              <span className="d-flex align-items-center gap-1 small text-dark">
                <MapPinIcon style={{width: '16px', height: '16px'}} />
                <span className="fw-medium">Lindoia - SP</span>
              </span>
              <a href="/loja" className="text-dark text-decoration-none fw-medium small">
                Entrar <UserIcon className="d-inline" style={{width: '16px', height: '16px'}} />
              </a>
              <button onClick={() => setCarrinhoAberto(true)} className="btn position-relative p-0 text-dark">
                <ShoppingCartIcon style={{width: '24px', height: '24px'}} />
                {totalItens > 0 && (
                  <span className="badge bg-dark rounded-pill position-absolute top-0 start-100 translate-middle fw-bold" style={{fontSize: '10px'}}>
                    {totalItens}
                  </span>
                )}
              </button>
            </div>

            {/* BOTÃO MENU — MOBILE */}
            <div className="col-auto d-md-none">
              <button onClick={() => setMenuAberto(!menuAberto)} className="btn p-0 text-dark">
                {menuAberto ? <XMarkIcon style={{width: '24px', height: '24px'}} /> : <Bars3Icon style={{width: '24px', height: '24px'}} />}
              </button>
            </div>
          </div>

          {/* MENU MOBILE ABERTO */}
          {menuAberto && (
            <div className="d-md-none mt-3 pt-2 border-top border-dark/10">
              <div className="d-flex flex-column gap-2 py-2">
                <span className="d-flex align-items-center gap-2 text-dark small">
                  <MapPinIcon style={{width: '16px', height: '16px'}} /> Lindoia - SP
                </span>
                <a href="/loja" className="text-dark text-decoration-none small fw-medium">Área Administrativa</a>
                <button onClick={() => { setCarrinhoAberto(true); setMenuAberto(false); }} className="btn btn-dark btn-sm w-100">
                  🛒 Meu Carrinho ({totalItens})
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ========================================== */}
      {/* 📂 BARRA DE CATEGORIAS */}
      {/* ========================================== */}
      <section className="categorias-bar py-2">
        <div className="container">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button 
              onClick={limparFiltros}
              className={`btn px-3 py-1 rounded-pill text-sm ${categoria === 'todas' ? 'btn-dark text-white' : 'btn-light text-dark border'}`}
            >
              Todos os Produtos
            </button>
            {categorias.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoria(cat); setBuscaAtiva(''); }}
                className={`btn px-3 py-1 rounded-pill text-sm ${categoria === cat ? 'btn-dark text-white' : 'btn-light text-dark border'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 📢 BANNER PRINCIPAL */}
      {/* ========================================== */}
      <section className="bg-dark text-white py-4 mb-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="h4 fw-bold mb-1">As melhores ofertas da região!</h2>
              <p className="opacity-75 mb-0">Produtos com qualidade e entrega rápida em Lindoia e região</p>
            </div>
            <div className="col-md-4 text-md-end mt-2 mt-md-0">
              <span className="badge bg-warning text-dark fs-6 fw-bold px-3 py-2">Entrega em até 24h*</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 📦 PRODUTOS */}
      {/* ========================================== */}
      <main className="container pb-5">
        {/* Resultados */}
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
            <div className="spinner-border text-dark" role="status" />
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
                  <div className="card h-100 border-0 rounded-3 shadow-sm card-produto overflow-hidden">
                    {/* IMAGEM */}
                    <div className="bg-white p-3 d-flex align-items-center justify-content-center" style={{height: '200px'}}>
                      <img
                        src={prod.imagem || 'https://placehold.co/300x300/EBEBEB/999?text=Produto'}
                        alt={prod.nome}
                        className="img-fluid"
                        style={{maxHeight: '180px', objectFit: 'contain'}}
                        onError={e => e.currentTarget.src='https://placehold.co/300x300/EBEBEB/999?text=Imagem+indisponível'}
                      />
                    </div>

                    {/* CONTEÚDO */}
                    <div className="card-body px-3 py-2">
                      {/* PREÇO */}
                      <div className="mb-1">
                        {temDesconto && (
                          <span className="text-decoration-line-through text-muted small me-2">
                            R$ {Number(prod.preco).toFixed(2)}
                          </span>
                        )}
                        <span className="preco-grande text-dark">
                          R$ {Math.floor(precoExib).toLocaleString('pt-BR')}
                          <span className="centavos">,{(precoExib % 100).toString().padStart(2, '0')}</span>
                        </span>
                      </div>

                      {/* PARCELAMENTO */}
                      <p className="text-muted small mb-1">
                        <span className="text-success">em até 10x de R$ {parcela}</span>
                      </p>

                      {/* FRETE */}
                      <p className="frete-gratis mb-2 d-flex align-items-center gap-1">
                        🚚 <span className="fw-medium">Entrega grátis</span>
                      </p>

                      {/* NOME */}
                      <h3 className="card-title h6 fw-normal text-dark mb-3" style={{fontSize: '14px', lineHeight: '1.3'}}>
                        {prod.nome}
                      </h3>

                      {/* BOTÃO */}
                      <button
                        onClick={() => adicionar(prod)}
                        className="btn btn-placetech w-100 fw-medium py-2"
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
      <footer className="bg-dark text-white py-5 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <h5 className="fw-bold text-uppercase mb-2" style={{color: AMARELO}}>Placetech</h5>
              <p className="small text-muted mb-0">
                Loja oficial da Placetech Lindoia<br />
                Qualidade e confiança em cada produto
              </p>
            </div>
            <div className="col-md-4 mb-4 mb-md-0">
              <h6 className="fw-bold mb-2">Contato</h6>
              <p className="small text-muted mb-1">📍 Lindoia - São Paulo</p>
              <p className="small text-muted mb-1">📧 atendimento@placetech.com.br</p>
            </div>
            <div className="col-md-4 text-md-end">
              <h6 className="fw-bold mb-2">Segurança</h6>
              <p className="small text-muted mb-1">✅ Seus dados protegidos</p>
              <p className="small text-muted mb-1">🔒 Pagamento seguro</p>
            </div>
          </div>
          <div className="border-top border-secondary mt-4 pt-3 text-center small text-muted">
            © {new Date().getFullYear()} Placetech Lindoia — Todos os direitos reservados
          </div>
        </div>
      </footer>

      {/* 🛒 COMPONENTE CARRINHO */}
      <Carrinho aberto={carrinhoAberto} fechar={() => setCarrinhoAberto(false)} />
    </div>
  );
}
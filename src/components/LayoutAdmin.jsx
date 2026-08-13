import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, ShoppingBagIcon, DocumentTextIcon,
  ChartBarIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon,
  Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';

// CORES OFICIAIS PLACETECH
const AMARELO = '#F9D828';
const PRETO = '#000000';
const AZUL = '#3483FA';
const FUNDO = '#EBEBEB';

const MENU = [
  { path: '',        icon: HomeIcon,           label: 'Dashboard',    desc: 'Visão geral' },
  { path: 'produtos', icon: ShoppingBagIcon,    label: 'Produtos',      desc: 'Gerenciar itens' },
  { path: 'importar', icon: ArrowDownTrayIcon,  label: 'Novo Produto',  desc: 'Adicionar via link' },
  { path: 'pedidos',  icon: DocumentTextIcon,    label: 'Pedidos',       desc: 'Acompanhar vendas' },
  { path: 'relatorios', icon: ChartBarIcon,     label: 'Relatórios',    desc: 'Dados gerenciais' },
];

export default function LayoutAdmin({ children, loading = false, titulo = '', subtitulo = '' }) {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const caminhoAtual = location.pathname.replace('/loja', '').replace('/', '') || '';

  const isAtivo = (p) => caminhoAtual === p;

  return (
    <div className="min-h-screen" style={{backgroundColor: FUNDO}}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        * { font-family: 'Roboto', -apple-system, sans-serif; }
        
        /* HEADER FIXO SEM ALTERAÇÃO */
        .bg-placetech-yellow { background-color: ${AMARELO}; }
        
        /* ITENS DE MENU — TRANSIÇÃO SUAVE */
        .menu-item { 
          border-radius: 12px; 
          transition: background-color 0.15s ease, color 0.15s ease;
          cursor: pointer;
        }
        .menu-item:hover { background-color: rgba(0,0,0,0.06); }
        .menu-item.ativo { background-color: ${AMARELO}; color: ${PRETO}; font-weight: 600; }
        
        /* CARDS PADRONIZADOS */
        .card-padrao { 
          border-radius: 16px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.08); 
          border: none; 
          background: white;
        }
        
        /* ÁREA DE CONTEÚDO — TRANSIÇÃO SUAVE */
        .conteudo-pagina {
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        .conteudo-pagina.carregando { opacity: 0.6; }
        
        /* LOADING CENTRALIZADO */
        .loading-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        /* BOTÃO PADRÃO */
        .btn-placetech { background-color: ${AZUL}; color: white; font-weight: 500; }
        .btn-placetech:hover { background-color: #2968D3; color: white; }
      `}</style>

      {/* ========================================== */}
      {/* 🔝 HEADER — FIXO, NÃO MUDA AO NAVEGAR */}
      {/* ========================================== */}
      <header className="bg-placetech-yellow py-3 shadow-sm sticky-top z-3">
        <div className="container">
          <div className="row align-items-center g-3">
            {/* Logo — SEMPRE IGUAL */}
            <div className="col-md-1">
              <Link to="/loja" className="text-decoration-none d-flex align-items-center gap-2">
                <span className="h4 fw-bold text-dark mb-0">Placetech</span>
              </Link>
            </div>

            {/* Título da Página — MUDA SUAVEMENTE */}
            <div className="col-md-8 d-none d-md-block">
              <h5 className="fw-bold text-dark mb-0 transition-all">{titulo}</h5>
              {subtitulo && <p className="small text-dark opacity-75 mb-0">{subtitulo}</p>}
            </div>

            {/* AÇÕES — SEMPRE IGUAIS */}
            <div className="col-md-2 ms-auto d-flex align-items-center gap-1">
              <a href="/" target="_blank" className="btn btn-dark btn-sm d-none d-md-flex align-items-center gap-1">
                <ArrowTopRightOnSquareIcon style={{width: '16px', height: '16px'}} />
                Ver Loja
              </a>
              <button 
                onClick={() => setMenuAberto(!menuAberto)}
                className="btn btn-dark btn-sm d-md-none"
              >
                {menuAberto ? <XMarkIcon style={{width: '20px', height: '20px'}} /> : <Bars3Icon style={{width: '20px', height: '20px'}} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* 📱 MENU MOBILE */}
      {/* ========================================== */}
      {menuAberto && (
        <div className="container d-md-none py-3 bg-white border-bottom shadow-sm">
          <nav className="d-flex flex-column gap-2">
            {MENU.map(item => (
              <Link
                key={item.path}
                to={`/loja/${item.path}`}
                onClick={() => setMenuAberto(false)}
                className={`menu-item d-flex align-items-center gap-3 px-3 py-2 text-decoration-none ${isAtivo(item.path) ? 'ativo' : 'text-dark'}`}
              >
                <item.icon style={{width: '20px', height: '20px'}} />
                <div>
                  <div className="fw-medium">{item.label}</div>
                  <div className="small opacity-50">{item.desc}</div>
                </div>
              </Link>
            ))}
            <hr className="my-2" />
            <a href="/" className="menu-item d-flex align-items-center gap-3 px-3 py-2 text-dark text-decoration-none">
              <ArrowTopRightOnSquareIcon style={{width: '20px', height: '20px'}} />
              <div>
                <div className="fw-medium">Ver Catálogo</div>
                <div className="small opacity-50">Acessar loja pública</div>
              </div>
            </a>
          </nav>
        </div>
      )}

      {/* ========================================== */}
      {/* 📏 CORPO: Menu Lateral + Conteúdo */}
      {/* ========================================== */}
      <div className="container py-4">
        <div className="row g-4">
          
          {/* MENU LATERAL — PERMANECE FIXO */}
          <div className="col-md-3 d-none d-md-block">
            <div className="card card-padrao p-3" style={{position: 'sticky', top: '90px'}}>
              <nav className="d-flex flex-column gap-1">
                {MENU.map(item => (
                  <Link
                    key={item.path}
                    to={`/loja/${item.path}`}
                    className={`menu-item d-flex align-items-center gap-3 px-3 py-2 text-decoration-none ${isAtivo(item.path) ? 'ativo' : 'text-dark'}`}
                  >
                    <item.icon style={{width: '20px', height: '20px'}} />
                    <div>
                      <div className="fw-medium">{item.label}</div>
                      <div className="small opacity-50">{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* CONTEÚDO — SÓ ISSO MUDA */}
          <div className="col-md-9 conteudo-pagina">
            {loading ? (
              <div className="card card-padrao p-5 loading-wrap">
                <div className="text-center">
                  <div className="spinner-border mb-3" style={{color: AMARELO}} role="status" />
                  <p className="fw-medium text-muted mb-0">Carregando dados...</p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
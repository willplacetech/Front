import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import {
  HomeIcon, ShoppingBagIcon, DocumentTextIcon,
  ChartBarIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon,
  Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

const MENU = [
  { path: '',         icon: HomeIcon,           label: 'Dashboard',   desc: 'Visão geral' },
  { path: 'produtos', icon: ShoppingBagIcon,    label: 'Produtos',    desc: 'Gerenciar itens' },
  { path: 'importar', icon: ArrowDownTrayIcon,  label: 'Novo Produto',desc: 'Adicionar produto' },
  { path: 'pedidos',  icon: DocumentTextIcon,   label: 'Pedidos',     desc: 'Acompanhar vendas' },
  { path: 'relatorios',icon: ChartBarIcon,      label: 'Relatórios',  desc: 'Dados gerenciais' },
];

export default function LayoutAdmin({ children, loading = false, titulo = '', subtitulo = '' }) {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const { sair } = useAuth();

  const caminhoAtual = location.pathname.replace('/loja', '').replace(/^\//, '') || '';
  const isAtivo = (p) => caminhoAtual === p;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        svg { max-width: none !important; max-height: none !important; }

        /* SIDEBAR */
        .sidebar {
          width: 260px;
          min-height: 100vh;
          background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          text-decoration: none;
          color: rgba(255,255,255,0.6);
          transition: all 0.15s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
        .nav-item.ativo {
          background: linear-gradient(135deg, #F9D828 0%, #F0C800 100%);
          color: #0F172A;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(249,216,40,0.3);
        }
        .nav-item.ativo .nav-desc { color: rgba(0,0,0,0.5); }
        .nav-icon-wrap { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nav-label { font-size: 14px; font-weight: 500; line-height: 1.2; }
        .nav-desc { font-size: 11px; opacity: 0.5; line-height: 1; margin-top: 2px; }

        /* CONTEÚDO */
        .main-content { margin-left: 260px; min-height: 100vh; }

        /* TOPBAR */
        .topbar {
          background: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
        }
        .topbar-title { font-size: 18px; font-weight: 700; color: #0F172A; }
        .topbar-sub { font-size: 13px; color: #6B7280; margin-top: 1px; }

        /* CARDS */
        .card-admin {
          background: white;
          border-radius: 16px;
          border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s;
        }
        .card-admin:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04); }

        /* MOBILE */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content { margin-left: 0; }
          .topbar { padding: 0 16px; }
        }
        .mobile-sidebar {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
        }
        .mobile-sidebar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
        }
        .mobile-sidebar-panel {
          position: relative;
          width: 280px;
          background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
          display: flex;
          flex-direction: column;
          z-index: 1;
        }

        /* BADGE */
        .badge-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>

      {/* ========== SIDEBAR DESKTOP ========== */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link to="/loja" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #F9D828, #F0C800)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '16px', color: '#0F172A'
              }}>P</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Placetech</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>Painel Admin</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {MENU.map(item => {
            const Icone = item.icon;
            const ativo = isAtivo(item.path);
            return (
              <Link key={item.path} to={`/loja/${item.path}`} className={`nav-item ${ativo ? 'ativo' : ''}`}>
                <div className="nav-icon-wrap">
                  <Icone style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <div className="nav-label">{item.label}</div>
                  <div className="nav-desc">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <a href="/" target="_blank" className="nav-item" style={{ marginBottom: '6px' }}>
            <div className="nav-icon-wrap">
              <ArrowTopRightOnSquareIcon style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="nav-label">Ver Catálogo</div>
          </a>
          <button onClick={sair} className="nav-item" style={{ color: '#F87171' }}>
            <div className="nav-icon-wrap">
              <ArrowRightStartOnRectangleIcon style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="nav-label">Sair</div>
          </button>
        </div>
      </aside>

      {/* ========== MENU MOBILE ========== */}
      {menuAberto && (
        <div className="mobile-sidebar">
          <div className="mobile-sidebar-overlay" onClick={() => setMenuAberto(false)} />
          <div className="mobile-sidebar-panel">
            <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Placetech Admin</span>
              <button onClick={() => setMenuAberto(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '22px', height: '22px' }} />
              </button>
            </div>
            <nav className="sidebar-nav">
              {MENU.map(item => {
                const Icone = item.icon;
                return (
                  <Link key={item.path} to={`/loja/${item.path}`} onClick={() => setMenuAberto(false)}
                    className={`nav-item ${isAtivo(item.path) ? 'ativo' : ''}`}>
                    <div className="nav-icon-wrap"><Icone style={{ width: '18px', height: '18px' }} /></div>
                    <div className="nav-label">{item.label}</div>
                  </Link>
                );
              })}
            </nav>
            <div className="sidebar-footer">
              <button onClick={sair} className="nav-item" style={{ color: '#F87171' }}>
                <div className="nav-icon-wrap"><ArrowRightStartOnRectangleIcon style={{ width: '18px', height: '18px' }} /></div>
                <div className="nav-label">Sair</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CONTEÚDO PRINCIPAL ========== */}
      <div className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <div className="topbar-title">{titulo || 'Painel'}</div>
            {subtitulo && <div className="topbar-sub">{subtitulo}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/" target="_blank" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: '#F9D828', color: '#0F172A',
              borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none',
              transition: 'all 0.15s'
            }}>
              <ArrowTopRightOnSquareIcon style={{ width: '15px', height: '15px' }} />
              Ver Loja
            </a>
            {/* Botão mobile */}
            <button onClick={() => setMenuAberto(true)} style={{
              display: 'none', background: '#F0F2F5', border: 'none', borderRadius: '8px',
              padding: '8px', cursor: 'pointer'
            }} className="mobile-menu-btn">
              <Bars3Icon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main style={{ padding: '28px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {loading ? (
            <div style={{
              background: 'white', borderRadius: '16px', padding: '80px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: '44px', height: '44px',
                border: '3px solid #F0F2F5',
                borderTopColor: '#F9D828',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <p style={{ color: '#6B7280', margin: 0, fontWeight: 500 }}>Carregando dados...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}
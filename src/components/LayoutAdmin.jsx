import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, ShoppingBagIcon, DocumentTextIcon,
  ChartBarIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon,
  Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';

const MENU = [
  { path: '',       icon: HomeIcon,          label: 'Dashboard',   cor: 'text-blue-500' },
  { path: 'produtos', icon: ShoppingBagIcon, label: 'Produtos',    cor: 'text-emerald-500' },
  { path: 'importar', icon: ArrowDownTrayIcon, label: 'Novo Produto', cor: 'text-cyan-500' },
  { path: 'pedidos',  icon: DocumentTextIcon, label: 'Pedidos',     cor: 'text-violet-500' },
  { path: 'relatorios', icon: ChartBarIcon,   label: 'Relatórios',  cor: 'text-pink-500' },
];

export default function LayoutAdmin({ children, loading = false, titulo = '', subtitulo = '' }) {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const isActive = (p) => {
    const caminho = `/loja/${p}`;
    return p === '' 
      ? location.pathname === '/loja' || location.pathname === '/loja/'
      : location.pathname.startsWith(caminho);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" data-theme="placetech">
      
      {/* MENU LATERAL */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-slate-200
        flex flex-col transition-transform duration-300
        ${menuAberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-placetech-600 to-placetech-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner">
              PT
            </div>
            <div className="text-white">
              <h1 className="font-black text-lg leading-tight">PLACETECH</h1>
              <p className="text-xs text-white/70 font-medium tracking-wider">LINDOIA</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Módulos
          </p>
          {MENU.map(item => (
            <Link
              key={item.path}
              to={`/loja/${item.path}`}
              onClick={() => setMenuAberto(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all
                ${isActive(item.path)
                  ? 'bg-placetech-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive(item.path) && <span className="ml-auto w-2 h-2 bg-white rounded-full"></span>}
            </Link>
          ))}
        </nav>

        {/* Link público */}
        <div className="p-4 border-t border-slate-100">
          <a href="/" target="_blank" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition">
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            Ver Catálogo Público
          </a>
        </div>
      </aside>

      {/* Overlay mobile */}
      {menuAberto && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button 
            onClick={() => setMenuAberto(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
          >
            <Bars3Icon className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            {titulo && <h2 className="text-xl font-black text-slate-800 truncate">{titulo}</h2>}
            {subtitulo && <p className="text-sm text-slate-500 truncate">{subtitulo}</p>}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Sistema Online
          </div>
        </header>

        {/* Corpo */}
        <main className="flex-1 p-6 overflow-auto relative">
          {/* Loading centralizado */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-placetech-100 border-t-placetech-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-semibold">Carregando...</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
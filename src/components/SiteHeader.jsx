import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCarrinho } from '../context/carrinho';

export default function SiteHeader({ onCarrinho }) {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  const { itens } = useCarrinho();
  const total = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const fechar = () => setAberto(false);
  return <header className="pt-header">
    <div className="pt-container pt-header-inner">
      <Link className="pt-logo" to="/" aria-label="Placetech, início" onClick={fechar}>
        <span className="pt-logo-mark" aria-hidden="true">P</span><span>placetech</span>
      </Link>
      <button className="pt-button pt-menu-toggle" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={aberto} aria-controls="site-navigation" onClick={() => setAberto(!aberto)}>
        {aberto ? <XMarkIcon /> : <Bars3Icon />}
      </button>
      <nav id="site-navigation" className={`pt-nav ${aberto ? 'is-open' : ''}`} aria-label="Navegação principal">
        <Link to="/#catalogo" onClick={fechar} aria-current={pathname === '/' ? 'page' : undefined}>Catálogo</Link>
        <Link className="nav-troca" to="/troca" onClick={fechar} aria-current={pathname === '/troca' ? 'page' : undefined}>Trocar meu aparelho</Link>
        <Link to="/comparar" onClick={fechar} aria-current={pathname === '/comparar' ? 'page' : undefined}>Comparar aparelhos</Link>
        {onCarrinho ? <button className="pt-button pt-button-primary" onClick={() => { fechar(); onCarrinho(); }}>Meu carrinho{total > 0 ? ` (${total})` : ''}</button>
          : <Link className="pt-button pt-button-primary" style={{ color: 'var(--bg-base)' }} to="/carrinho" onClick={fechar}>Meu carrinho{total > 0 ? ` (${total})` : ''}</Link>}
      </nav>
    </div>
  </header>;
}

import SiteHeader from '../components/SiteHeader';
import { Link, useNavigate } from 'react-router-dom';
import Carrinho from '../components/carrinho';
import '../components/Variantes.css';

export default function CarrinhoPagina() {
  const navigate = useNavigate();
  return <main className="variant-page"><SiteHeader /><div className="variant-page-inner">
    <Link to="/#catalogo">← Voltar ao catálogo</Link>
    <h1>Seu próximo aparelho.</h1>
    <Carrinho aberto fechar={() => navigate('/#catalogo')} />
  </div></main>;
}

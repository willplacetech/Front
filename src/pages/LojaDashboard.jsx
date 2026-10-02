import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/auth';
import Dashboard from './dashboard';
import ProdutosCrud from './ProdutosCrud';
import Pedidos from './Pedidos';
import Relatorios from './Relatorios';
import ImportarML from './ImportarML';
import Login from './login';
import { useEffect, useState } from 'react';
import api from '../services/api';
import TrocasAdminProvider from '../context/TrocasAdminProvider';
import TrocasAdmin from './TrocasAdmin';
import TrocaAdminDetalhe from './TrocaAdminDetalhe';

export default function LojaDashboard() {
  const { token, sair } = useAuth();
  const [verificacao, setVerificacao] = useState({ token: '', erro: '' });
  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    api.get('/auth/admin', { signal: controle.signal }).then(() => setVerificacao({ token, erro: '' }))
      .catch(error => { if (!controle.signal.aborted) setVerificacao({ token,
        erro: error.response?.data?.error || 'Não foi possível verificar seu acesso administrativo.' }); });
    return () => controle.abort();
  }, [token]);
  if (!token) return <Login />;
  if (verificacao.token !== token) return <p className="variant-page variant-status" role="status">Verificando acesso administrativo…</p>;
  if (verificacao.erro) return <main className="variant-page"><div className="variant-page-inner">
    <p role="alert">{verificacao.erro}</p><button className="variant-clear" onClick={sair}>Sair e entrar como administrador</button>
  </div></main>;

  return (
    <TrocasAdminProvider><Routes>
      <Route path="/"           element={<Dashboard />} />
      <Route path="/produtos"   element={<ProdutosCrud />} />
      <Route path="/importar"   element={<ImportarML />} />
      <Route path="/pedidos"    element={<Pedidos />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/trocas" element={<TrocasAdmin />} />
      <Route path="/trocas/:id" element={<TrocaAdminDetalhe />} />
    </Routes></TrocasAdminProvider>
  );
}

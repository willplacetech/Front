import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/auth';
import Dashboard from './dashboard';
import ProdutosCrud from './ProdutosCrud';
import Pedidos from './Pedidos';
import Relatorios from './Relatorios';
import ImportarML from './ImportarML';
import Login from './login';

export default function LojaDashboard() {
  const { token } = useAuth();
  if (!token) return <Login />;

  return (
    <Routes>
      <Route path="/"           element={<Dashboard />} />
      <Route path="/produtos"   element={<ProdutosCrud />} />
      <Route path="/importar"   element={<ImportarML />} />
      <Route path="/pedidos"    element={<Pedidos />} />
      <Route path="/relatorios" element={<Relatorios />} />
    </Routes>
  );
}
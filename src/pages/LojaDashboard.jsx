import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ProdutosCrud from './ProdutosCrud';
import Pedidos from './Pedidos';
import Relatorios from './Relatorios';
import ImportarML from './ImportarML';

export default function LojaDashboard() {
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
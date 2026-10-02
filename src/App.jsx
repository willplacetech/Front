import { Routes, Route } from 'react-router-dom';
import { CarrinhoProvider } from './context/carrinhocontext';
import { AuthProvider } from './context/authcontext';
import Catalogo from './pages/catalogo';
import LojaDashboard from './pages/LojaDashboard';
import ProdutoDetalhe from './pages/ProdutoDetalhe';
import Troca from './pages/Troca';

function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <Routes>
          <Route path="/troca" element={<Troca />} />
          <Route path="/produto/:id" element={<ProdutoDetalhe />} />
          <Route path="/*" element={<Catalogo />} />
          <Route path="/loja/*" element={<LojaDashboard />} />
        </Routes>
      </CarrinhoProvider>
    </AuthProvider>
  );
}

export default App;

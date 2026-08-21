import { Routes, Route } from 'react-router-dom';
import { CarrinhoProvider } from './context/carrinhocontext';
import { AuthProvider } from './context/authcontext';
import Catalogo from './pages/catalogo';
import LojaDashboard from './pages/LojaDashboard';

function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <Routes>
          <Route path="/*" element={<Catalogo />} />
          <Route path="/loja/*" element={<LojaDashboard />} />
        </Routes>
      </CarrinhoProvider>
    </AuthProvider>
  );
}

export default App;
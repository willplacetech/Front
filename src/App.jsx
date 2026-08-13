import { Routes, Route } from 'react-router-dom';
import { CarrinhoProvider } from './context/CarrinhoContext';
import Catalogo from './pages/Catalogo';
import LojaDashboard from './pages/LojaDashboard';

function App() {
  return (
    <CarrinhoProvider>
      <Routes>
        <Route path="/*" element={<Catalogo />} />
        <Route path="/loja/*" element={<LojaDashboard />} />
      </Routes>
    </CarrinhoProvider>
  );
}

export default App;
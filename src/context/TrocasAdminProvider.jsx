import { useEffect, useState } from 'react';
import api from '../services/api';
import { TrocasAdminContext } from './trocasAdmin';

export default function TrocasAdminProvider({ children }) {
  const [resultado, setResultado] = useState({ trocas: [], carregando: true, erro: '' });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controle = new AbortController();
    api.get('/troca/admin', { signal: controle.signal }).then(({ data }) => setResultado({ trocas: data, carregando: false, erro: '' }))
      .catch(error => { if (!controle.signal.aborted) setResultado(atual => ({ ...atual, carregando: false,
        erro: error.response?.data?.error || 'Não foi possível carregar as trocas.' })); });
    return () => controle.abort();
  }, [tentativa]);
  useEffect(() => {
    const atualizar = () => setTentativa(t => t + 1);
    window.addEventListener('focus', atualizar);
    return () => window.removeEventListener('focus', atualizar);
  }, []);
  const recarregar = () => { setResultado(atual => ({ ...atual, carregando: true, erro: '' })); setTentativa(t => t + 1); };
  const registrar = troca => setResultado(atual => ({ ...atual, trocas: atual.trocas.some(t => t._id === troca._id)
    ? atual.trocas.map(t => t._id === troca._id ? troca : t) : [troca, ...atual.trocas] }));
  return <TrocasAdminContext.Provider value={{ ...resultado, recarregar, registrar,
    pendentes: resultado.trocas.filter(t => t.status === 'pendente').length }}>{children}</TrocasAdminContext.Provider>;
}

import { useEffect, useState } from 'react';
import api from '../services/api';
import { AuthContext, TOKEN_KEY } from './auth';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [perfil, setPerfil] = useState({ token: null, user: null, erro: '' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    api.get('/auth/me', { signal: controle.signal })
      .then(({ data }) => setPerfil({ token, user: data.user, erro: '' }))
      .catch(error => {
        if (!controle.signal.aborted) setPerfil({ token, user: null, erro: error.response?.data?.error || 'Não foi possível carregar seus dados. Tente novamente.' });
      });
    return () => controle.abort();
  }, [token, tentativa]);

  const recarregarUsuario = () => {
    setPerfil({ token: null, user: null, erro: '' });
    setTentativa(valor => valor + 1);
  };

  const entrar = async (usuario, senha) => {
    const resposta = await api.post('/auth/login', { usuario, senha });
    localStorage.setItem(TOKEN_KEY, resposta.data.token);
    setToken(resposta.data.token);
  };

  const sair = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return <AuthContext.Provider value={{ token, entrar, sair,
    user: token && perfil.token === token ? perfil.user : null,
    carregandoUsuario: Boolean(token && perfil.token !== token),
    erroUsuario: token && perfil.token === token ? perfil.erro : '',
    recarregarUsuario
  }}>{children}</AuthContext.Provider>;
}


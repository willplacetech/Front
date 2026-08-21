import { useState } from 'react';
import api from '../services/api';
import { AuthContext, TOKEN_KEY } from './auth';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));

  const entrar = async (usuario, senha) => {
    const resposta = await api.post('/auth/login', { usuario, senha });
    sessionStorage.setItem(TOKEN_KEY, resposta.data.token);
    setToken(resposta.data.token);
  };

  const sair = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return <AuthContext.Provider value={{ token, entrar, sair }}>{children}</AuthContext.Provider>;
}


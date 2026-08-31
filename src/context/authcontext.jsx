import { useState } from 'react';
import api from '../services/api';
import { AuthContext, TOKEN_KEY } from './auth';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const entrar = async (usuario, senha) => {
    const resposta = await api.post('/auth/login', { usuario, senha });
    localStorage.setItem(TOKEN_KEY, resposta.data.token);
    setToken(resposta.data.token);
  };

  const sair = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return <AuthContext.Provider value={{ token, entrar, sair }}>{children}</AuthContext.Provider>;
}


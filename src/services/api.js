import axios from 'axios';
import { TOKEN_KEY } from '../context/auth';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const defaultApiUrl = isLocalhost ? 'http://localhost:5000' : 'https://back-ka2g.onrender.com';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || defaultApiUrl}/api`
});

// 🔐 Interceptor de Requisição — Adiciona token JWT
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token adicionado ao header:', token.substring(0, 20) + '...');
  } else {
    console.log('⚠️ Nenhum token encontrado em sessionStorage');
  }
  return config;
});

// 🔄 Interceptor de Resposta — Trata erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Erro 401 recebido:', error.response?.data?.error);
      
      // Apenas redireciona se estiver na área protegida /loja e tiver tentado fazer login com erro
      if (window.location.pathname.startsWith('/loja') && window.location.pathname !== '/loja') {
        console.log('🔄 Redirecionando para /loja para novo login...');
        sessionStorage.removeItem(TOKEN_KEY);
        window.location.assign('/loja');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
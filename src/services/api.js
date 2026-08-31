import axios from 'axios';
import { TOKEN_KEY } from '../context/auth';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const defaultApiUrl = isLocalhost ? 'http://localhost:5000' : 'https://back-ka2g.onrender.com';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || defaultApiUrl}/api`
});

// 🔐 Interceptor de Requisição — Adiciona token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
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

      const pathname = window.location.pathname;
      // ✅ Só força logout/redirect em sub-rotas protegidas (ex: /loja/produtos, /loja/pedidos)
      // NUNCA em /loja ou /loja/ (que é a própria página de login)
      const isProtectedSubRoute =
        pathname.startsWith('/loja/') && pathname.replace(/\/$/, '') !== '/loja';

      if (isProtectedSubRoute) {
        console.log('🔄 Sessão expirada — redirecionando para login...');
        localStorage.removeItem(TOKEN_KEY);
        window.location.assign('/loja');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
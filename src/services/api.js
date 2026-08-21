import axios from 'axios';
import { TOKEN_KEY } from '../context/auth';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://back-ka2g.onrender.com'}/api`
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/loja')) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.location.assign('/loja');
    }
    return Promise.reject(error);
  }
);

export default api;
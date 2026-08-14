import axios from 'axios';

const api = axios.create({
  baseURL: 'https://back-ka2g.onrender.com/api'
});

export default api;
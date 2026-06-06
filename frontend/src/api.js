import axios from 'axios';

const API = axios.create({ 
  baseURL: 'http://localhost:8000',
  headers: { 'Cache-Control': 'no-cache' }
});
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const signup    = (data) => API.post('/signup', data);
export const login     = (data) => {
  const form = new URLSearchParams();
  form.append('username', data.email);
  form.append('password', data.password);
  return API.post('/login', form);
};
export const getDashboard     = ()       => API.get('/dashboard');
export const searchCompany    = (ticker) => API.get(`/search/${ticker}`);
export const compareCompanies = (t1, t2) => API.get(`/compare?t1=${t1}&t2=${t2}`);
export const getAllCompanies   = ()       => API.get('/all-companies');
export const addWatchlist     = (ticker) => API.post(`/watchlist/${ticker}`);
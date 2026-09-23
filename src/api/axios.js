import axios from 'axios';

// Normalize base URL to ensure proper format and /api endpoint path
const normalizeBaseUrl = (url) => {
  if (!url) return '/api';
  let cleaned = url.trim().replace(/\/+$/, '');
  // If a full HTTP(S) URL is passed without an '/api' suffix, append it
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    if (!cleaned.endsWith('/api')) {
      cleaned = `${cleaned}/api`;
    }
  }
  return cleaned;
};

// Production Backend URL specified by deployment:
// https://co-working-space-desk-backend.vercel.app
const DEFAULT_PROD_URL = 'https://co-working-space-desk-backend.vercel.app/api';

const rawUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_URL : '/api');

export const API_BASE_URL = normalizeBaseUrl(rawUrl);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cowork_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state
      localStorage.removeItem('cowork_token');
      localStorage.removeItem('cowork_user');
      // Redirect to login if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

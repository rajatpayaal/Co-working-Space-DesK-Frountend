import apiClient from './axios';

export const authApi = {
  // POST /api/auth/login
  login: (credentials) => apiClient.post('/auth/login', credentials),

  // POST /api/auth/register
  register: (data) => apiClient.post('/auth/register', data),

  // GET /api/auth/me
  getMe: () => apiClient.get('/auth/me'),

  // POST /api/auth/logout
  logout: () => apiClient.post('/auth/logout'),

  // POST /api/auth/forgot-password
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),

  // POST /api/auth/reset-password
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),

  changePassword: (data) => apiClient.patch('/auth/change-password', data),
  refresh: () => apiClient.post('/auth/refresh'),
};

export default authApi;

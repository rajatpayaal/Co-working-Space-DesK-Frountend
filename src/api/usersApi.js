import apiClient from './axios';

export const usersApi = {
  // GET /api/users (admin — mounted at /api/users in app.ts)
  getAll: (params) => apiClient.get('/users', { params }),

  // GET /api/users/:id
  getById: (id) => apiClient.get(`/users/${id}`),

  // PATCH /api/users/:id
  update: (id, data) => apiClient.patch(`/users/${id}`, data),

  // PATCH /api/users/:id/activate
  activate: (id) => apiClient.patch(`/users/${id}/activate`),

  // PATCH /api/users/:id/deactivate
  deactivate: (id) => apiClient.patch(`/users/${id}/deactivate`),
};

export default usersApi;

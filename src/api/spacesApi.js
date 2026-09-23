import apiClient from './axios';

export const spacesApi = {
  // ── Public Routes (mounted at /api/spaces) ──────────────────────────
  // GET /api/spaces
  getAll: (params) => apiClient.get('/spaces', { params }),

  // GET /api/spaces/:id
  getById: (id) => apiClient.get(`/spaces/${id}`),

  // GET /api/spaces/:id/availability?date=YYYY-MM-DD
  getAvailability: (id, params) => apiClient.get(`/spaces/${id}/availability`, { params }),

  // GET /api/spaces/:id/slots?date=YYYY-MM-DD&duration=60
  getSlots: (id, params) => apiClient.get(`/spaces/${id}/slots`, { params }),

  // POST /api/availability/check
  checkAvailability: (data) => apiClient.post('/availability/check', data),

  // ── Admin Routes (mounted at /api/admin) ─────────────────────────────
  // GET /api/admin/spaces
  getAdminAll: (params) => apiClient.get('/admin/spaces', { params }),

  // GET /api/admin/spaces/:id
  getAdminById: (id) => apiClient.get(`/admin/spaces/${id}`),

  // POST /api/admin/spaces
  create: (data) => apiClient.post('/admin/spaces', data),

  // PATCH /api/admin/spaces/:id
  update: (id, data) => apiClient.patch(`/admin/spaces/${id}`, data),

  // DELETE /api/admin/spaces/:id
  delete: (id) => apiClient.delete(`/admin/spaces/${id}`),
};

export default spacesApi;

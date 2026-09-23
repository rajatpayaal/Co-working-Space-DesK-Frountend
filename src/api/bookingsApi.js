import apiClient from './axios';

export const bookingsApi = {
  // GET /api/bookings (admin: all, member: own)
  getAll: (params) => apiClient.get('/bookings', { params }),

  // GET /api/bookings/:id
  getById: (id) => apiClient.get(`/bookings/${id}`),

  // POST /api/bookings
  create: (data) => apiClient.post('/bookings', data),

  // PATCH /api/bookings/:id and POST /api/bookings/:id/cancel
  update: (id, data) => apiClient.patch(`/bookings/${id}`, data),
  cancel: (id) => apiClient.post(`/bookings/${id}/cancel`),

  // Admin booking endpoints
  getAdminAll: (params) => apiClient.get('/admin/bookings', { params }),
  getAdminById: (id) => apiClient.get(`/admin/bookings/${id}`),
  approve: (id) => apiClient.patch(`/admin/bookings/${id}/approve`),

  // PUT /api/bookings/:id/reject (admin)
  reject: (id, reason) => apiClient.patch(`/admin/bookings/${id}/reject`, { reason }),
};

export default bookingsApi;

import apiClient from './axios';

// Actual backend mount points (from app.ts):
// /api/maintenance  → maintenanceRoutes
// /api/roles        → rolesRoutes
// /api/permissions  → permissionsRoutes
// /api/admin        → adminSpacesRouter + adminBookingsRouter (spaces & bookings only)
// /api/dashboard    → dashboardRoutes

export const adminApi = {
  // ── Dashboard ──────────────────────────────────────────────────────
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  getDashboardBookings: (params) => apiClient.get('/dashboard/bookings', { params }),
  getDashboardRevenue: (params) => apiClient.get('/dashboard/revenue', { params }),
  getDashboardActivity: () => apiClient.get('/dashboard/activity'),
  getBookingTrends: (params) => apiClient.get('/dashboard/booking-trends', { params }),

  // ── Maintenance  (mounted at /api/maintenance) ─────────────────────
  getMaintenance: (params) => apiClient.get('/maintenance', { params }),
  createMaintenance: (data) => apiClient.post('/maintenance', data),
  getMaintenanceById: (id) => apiClient.get(`/maintenance/${id}`),
  updateMaintenance: (id, data) => apiClient.patch(`/maintenance/${id}`, data),
  deleteMaintenance: (id) => apiClient.delete(`/maintenance/${id}`),

  // ── Roles  (mounted at /api/roles) ────────────────────────────────
  getRoles: () => apiClient.get('/roles'),
  createRole: (data) => apiClient.post('/roles', data),
  getRole: (id) => apiClient.get(`/roles/${id}`),
  updateRole: (id, data) => apiClient.patch(`/roles/${id}`, data),
  deleteRole: (id) => apiClient.delete(`/roles/${id}`),

  // ── Permissions  (mounted at /api/permissions) ────────────────────
  getPermissions: () => apiClient.get('/permissions'),
  getRolePermissions: (id) => apiClient.get(`/permissions/roles/${id}/permissions`),
  setRolePermissions: (id, permissionIds) =>
    apiClient.put(`/permissions/roles/${id}/permissions`, { permissionIds }),
};

export default adminApi;

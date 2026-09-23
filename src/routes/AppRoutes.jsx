import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/LoadingSpinner';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Public pages (lazy would be ideal but keeping direct imports for build simplicity)
import Landing from '../pages/public/Landing';
import ExploreSpaces from '../pages/public/ExploreSpaces';
import SpaceDetails from '../pages/public/SpaceDetails';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import BookingCheckout from '../pages/public/BookingCheckout';

// Member pages
import MemberDashboard from '../pages/member/Dashboard';
import MyBookings from '../pages/member/MyBookings';
import BookingDetails from '../pages/member/BookingDetails';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import SpaceManagement from '../pages/admin/SpaceManagement';
import CreateEditSpace from '../pages/admin/CreateEditSpace';
import BookingManagement from '../pages/admin/BookingManagement';
import MaintenanceManagement from '../pages/admin/MaintenanceManagement';
import UserManagement from '../pages/admin/UserManagement';
import RolesPermissions from '../pages/admin/RolesPermissions';

// Route Guards
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/spaces" element={<ExploreSpaces />} />
        <Route path="/spaces/:id" element={<SpaceDetails />} />
        <Route path="/booking/:id" element={<BookingCheckout />} />
      </Route>

      {/* Auth Routes (redirect if already logged in) */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Member Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/my-bookings/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/spaces" element={<SpaceManagement />} />
        <Route path="/admin/spaces/new" element={<CreateEditSpace />} />
        <Route path="/admin/spaces/:id/edit" element={<CreateEditSpace />} />
        <Route path="/admin/bookings" element={<BookingManagement />} />
        <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/roles" element={<RolesPermissions />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

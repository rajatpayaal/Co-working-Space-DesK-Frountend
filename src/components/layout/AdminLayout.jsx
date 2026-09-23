import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../hooks/useAuth';

const PAGE_TITLES = {
  '/admin/dashboard': { title: 'System Dashboard', subtitle: 'Monitor workspace operations and real-time metrics', icon: 'dashboard' },
  '/admin/spaces': { title: 'Space Management', subtitle: 'Manage all workspace listings and configurations', icon: 'apartment' },
  '/admin/spaces/new': { title: 'Create Space', subtitle: 'Add a new workspace to the catalogue', icon: 'add_business' },
  '/admin/bookings': { title: 'Booking Management', subtitle: 'Review, approve, and manage member reservations', icon: 'event_available' },
  '/admin/maintenance': { title: 'Maintenance Management', subtitle: 'Track and manage service tickets and upkeep', icon: 'build' },
  '/admin/users': { title: 'User Management', subtitle: 'Manage member accounts and access permissions', icon: 'group' },
  '/admin/roles': { title: 'Roles & Permissions', subtitle: 'Configure role-based access control policies', icon: 'shield_person' },
};

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'Admin Console',
    subtitle: 'CoWork Spot Management Portal',
    icon: 'admin_panel_settings',
  };

  // For edit pages
  const editMatch = location.pathname.match(/\/admin\/spaces\/(.+)/);
  if (editMatch && editMatch[1] !== 'new') {
    pageInfo.title = 'Edit Space';
    pageInfo.subtitle = 'Modify workspace details and configuration';
    pageInfo.icon = 'edit';
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden xl:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="xl:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 xl:pl-72 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="fixed top-0 left-0 xl:left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl z-30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/50">
          <div className="h-16 w-full px-6 xl:px-8 flex items-center justify-between gap-4">
            {/* Left: Mobile toggle + Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="xl:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0">{pageInfo.icon}</span>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-on-surface leading-tight truncate">{pageInfo.title}</h1>
                  <p className="hidden sm:block text-[11px] text-on-surface-variant truncate">{pageInfo.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Right: Search + Status + User */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Search */}
              <div className="hidden lg:flex relative items-center">
                <span className="material-symbols-outlined absolute left-3 text-[16px] text-on-surface-variant pointer-events-none">search</span>
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-48 xl:w-64 pl-9 pr-4 py-1.5 text-xs bg-surface-container-lowest text-on-surface rounded-lg border border-outline-variant placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                />
              </div>

              {/* Live Status */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-[11px] font-medium tracking-wide font-mono text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>Live</span>
              </div>

              {/* Portal Link */}
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                <span>Portal</span>
              </Link>

              {/* Admin Avatar */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-on-surface leading-tight">
                      {currentUser?.fullName || currentUser?.name || 'Admin'}
                    </span>
                    <span className="px-1 py-0.5 rounded bg-primary-fixed text-[9px] font-bold text-primary tracking-wider">
                      {currentUser?.role || 'ADMIN'}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">{currentUser?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-16 min-h-screen bg-surface">
          <div className="w-full px-6 xl:px-8 py-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

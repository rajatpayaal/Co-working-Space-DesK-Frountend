import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Space Management', path: '/admin/spaces', icon: 'apartment' },
  { label: 'Booking Management', path: '/admin/bookings', icon: 'event_available' },
  { label: 'Maintenance', path: '/admin/maintenance', icon: 'build' },
  { label: 'User Management', path: '/admin/users', icon: 'group' },
  { label: 'Roles & Permissions', path: '/admin/roles', icon: 'shield_person' },
];

export const AdminSidebar = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between shadow-[0_2px_16px_rgba(58,48,42,0.04)] border-r border-outline-variant">
      {/* Top: Brand + Nav */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 bg-surface-container-low border-b border-outline-variant/50 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline text-lg font-bold tracking-tight text-on-surface leading-none">CoWork Spot</span>
            <span className="text-[10px] font-semibold tracking-widest text-primary uppercase mt-0.5">Admin Console</span>
          </div>
          {/* Mobile close button */}
          {onClose && (
            <button onClick={onClose} className="ml-auto p-1 rounded text-on-surface-variant hover:text-on-surface xl:hidden">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="px-4 py-5 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 px-3 mb-3">Platform Operations</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-fixed text-on-primary-fixed font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom: Status + User + Logout */}
      <div className="p-4 bg-surface-container space-y-3 flex-shrink-0 border-t border-outline-variant/50">
        {/* System Status */}
        <div className="bg-surface rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[11px] font-semibold text-on-surface uppercase tracking-wide">System Online</span>
          </div>
          <p className="text-[10px] text-on-surface-variant font-mono">RBAC Guard Enforced</p>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-on-surface truncate">{currentUser.fullName || currentUser.name || 'Admin'}</div>
              <div className="text-[10px] text-on-surface-variant truncate">{currentUser.email}</div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

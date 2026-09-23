import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isAdmin, isMember, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(58,48,42,0.04)] border-b border-outline-variant/50">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight text-on-surface">CoWork Spot</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-7">
          <NavLink to="/spaces" className={({ isActive }) =>
            `text-sm transition-colors font-medium ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`
          }>Explore Spaces</NavLink>
          <a href="#amenities" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium">Amenities & Perks</a>
          <a href="#pricing" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium">Pricing</a>
          {isAuthenticated && isMember && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) =>
                `text-sm transition-colors font-medium ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`
              }>Dashboard</NavLink>
              <NavLink to="/my-bookings" className={({ isActive }) =>
                `text-sm transition-colors font-medium ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`
              }>My Bookings</NavLink>
            </>
          )}
          {isAuthenticated && isAdmin && (
            <NavLink to="/admin/dashboard" className={({ isActive }) =>
              `text-sm transition-colors font-medium ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`
            }>Admin Console</NavLink>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-2 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-medium shadow-sm hover:bg-on-primary-fixed-variant transition-colors">
                Get Started
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-on-surface-variant font-medium">
                {currentUser?.fullName || currentUser?.name}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-2 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
          {/* Mobile Menu Toggle */}
          <button
            className="xl:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="material-symbols-outlined text-[22px]">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-surface-container-lowest border-t border-outline-variant shadow-lg animate-slide-down">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
            <Link to="/spaces" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-on-surface-variant py-2 hover:text-primary transition-colors">Explore Spaces</Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-on-surface-variant py-2 hover:text-primary transition-colors">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-medium text-center">Get Started</Link>
              </>
            ) : (
              <>
                {isMember && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-on-surface-variant py-2 hover:text-primary transition-colors">Dashboard</Link>}
                {isMember && <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-on-surface-variant py-2 hover:text-primary transition-colors">My Bookings</Link>}
                {isAdmin && <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-on-surface-variant py-2 hover:text-primary transition-colors">Admin Console</Link>}
                <button onClick={handleLogout} className="text-sm font-medium text-error py-2 text-left">Sign Out</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

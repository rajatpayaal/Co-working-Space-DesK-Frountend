import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleGoBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else if (isAdmin) {
      navigate('/admin/dashboard');
    } else if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-background page-fade-in">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-10 text-center shadow-lg">
        {/* Visual 404 Icon & Code */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl">travel_explore</span>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
          Error 404 · Route Not Found
        </p>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface mt-2">
          This page does not exist
        </h1>
        <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
          The link you followed may be broken, or the page may have been removed or moved to another destination.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleGoBack}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Go Back
          </Button>

          <Link
            to={isAdmin ? '/admin/dashboard' : isAuthenticated ? '/dashboard' : '/'}
            className="w-full sm:w-auto"
          >
            <Button variant="primary" size="md" className="w-full">
              <span className="material-symbols-outlined text-base">home</span>
              {isAdmin ? 'Admin Dashboard' : 'Return Home'}
            </Button>
          </Link>
        </div>

        {/* Quick directory links */}
        <div className="mt-8 pt-6 border-t border-outline-variant/60 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
          <Link to="/spaces" className="hover:text-primary transition-colors">Explore Spaces</Link>
          <span>·</span>
          {isAdmin ? (
            <>
              <Link to="/admin/spaces" className="hover:text-primary transition-colors">Space Management</Link>
              <span>·</span>
              <Link to="/admin/bookings" className="hover:text-primary transition-colors">Bookings</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
              <span>·</span>
              <Link to="/register" className="hover:text-primary transition-colors">Membership</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ErrorBoundary from '../common/ErrorBoundary';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 page-fade-in">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default PublicLayout;

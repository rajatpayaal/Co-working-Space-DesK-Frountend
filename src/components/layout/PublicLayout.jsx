import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 page-fade-in">
        <Outlet />
      </div>
    </div>
  );
};

export default PublicLayout;

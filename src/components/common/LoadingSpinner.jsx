import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className={`${sizes[size]} animate-spin text-primary`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
};

export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
      <span className="material-symbols-outlined text-on-primary text-xl">bolt</span>
    </div>
    <LoadingSpinner size="md" />
    <p className="text-sm text-on-surface-variant font-medium">{message}</p>
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <div className="h-3 bg-surface-container-high rounded w-24" />
        <div className="h-8 bg-surface-container-high rounded w-16" />
      </div>
      <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
    </div>
    <div className="h-3 bg-surface-container-high rounded w-32" />
  </div>
);

export const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-3.5 px-4"><div className="h-3 bg-surface-container-high rounded w-20" /></td>
    <td className="py-3.5 px-4"><div className="h-3 bg-surface-container-high rounded w-32" /></td>
    <td className="py-3.5 px-4"><div className="h-3 bg-surface-container-high rounded w-28" /></td>
    <td className="py-3.5 px-4"><div className="h-3 bg-surface-container-high rounded w-20" /></td>
    <td className="py-3.5 px-4"><div className="h-3 bg-surface-container-high rounded w-16" /></td>
    <td className="py-3.5 px-4"><div className="h-5 bg-surface-container-high rounded-full w-20" /></td>
    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-surface-container-high rounded w-16 ml-auto" /></td>
  </tr>
);

export default LoadingSpinner;

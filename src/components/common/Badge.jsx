import React from 'react';

const statusConfig = {
  approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: 'check_circle', dot: 'bg-green-500' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: 'check_circle', dot: 'bg-green-500' },
  active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: 'check_circle', dot: 'bg-green-500' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: 'schedule', dot: 'bg-amber-500' },
  pending_approval: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: 'schedule', dot: 'bg-amber-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: 'cancel', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', border: 'border-outline-variant', icon: 'do_not_disturb_on', dot: 'bg-outline' },
  inactive: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', border: 'border-outline-variant', icon: 'do_not_disturb_on', dot: 'bg-outline' },
  maintenance: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', icon: 'build', dot: 'bg-orange-500' },
  admin: { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed', border: 'border-primary-fixed-dim', icon: 'shield_person', dot: 'bg-primary' },
  member: { bg: 'bg-surface-container', text: 'text-on-surface-variant', border: 'border-outline-variant', icon: 'person', dot: 'bg-secondary' },
  super_admin: { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed', border: 'border-primary-fixed-dim', icon: 'security', dot: 'bg-primary' },
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const key = String(variant).toLowerCase().replace(/[\s-]/g, '_');
  const config = statusConfig[key] || {
    bg: 'bg-surface-container',
    text: 'text-on-surface-variant',
    border: 'border-outline-variant',
    icon: 'circle',
    dot: 'bg-outline',
  };

  const label = children || variant;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border} whitespace-nowrap ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {String(label).replace(/_/g, ' ')}
    </span>
  );
};

export default Badge;

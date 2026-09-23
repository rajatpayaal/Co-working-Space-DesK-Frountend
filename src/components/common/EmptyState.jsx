import React from 'react';

export const EmptyState = ({
  icon = 'inbox',
  title = 'No records found',
  description = 'There are no items to display.',
  action,
}) => (
  <div className="py-16 px-6 text-center flex flex-col items-center gap-4">
    <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div>
      <h3 className="font-headline text-xl text-on-surface font-normal">{title}</h3>
      <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
    {action && (
      <div className="mt-2">{action}</div>
    )}
  </div>
);

export default EmptyState;

import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-lg whitespace-nowrap cursor-pointer select-none border';

  const variants = {
    primary: 'bg-primary text-on-primary border-transparent hover:bg-on-primary-fixed-variant shadow-sm',
    secondary: 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container-low',
    danger: 'bg-error text-on-error border-transparent hover:opacity-90',
    ghost: 'bg-transparent text-on-surface border-transparent hover:bg-surface-container',
    outline: 'bg-transparent text-on-surface border-outline-variant hover:bg-surface-container-low',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2.5 min-h-[40px]',
    lg: 'text-sm px-6 py-3 min-h-[48px]',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;

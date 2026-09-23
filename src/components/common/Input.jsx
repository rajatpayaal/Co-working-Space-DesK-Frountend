import React from 'react';

export const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  id,
  helperText,
  required,
  icon,
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}{required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 bg-surface-container-lowest border ${error ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/15'} rounded-xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-3 transition ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-error font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-on-surface-variant">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

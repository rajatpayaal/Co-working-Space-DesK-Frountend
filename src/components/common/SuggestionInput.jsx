import React, { useState, useRef, useEffect } from 'react';

export const SuggestionInput = ({
  label,
  name,
  id,
  value = '',
  onChange,
  suggestions = [],
  placeholder = '',
  icon,
  required = false,
  error,
  helperText,
  multi = false,
  chips = false,
  maxChips = 12,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const inputId = id || name;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Check if an item is selected
  const isItemSelected = (item) => {
    const itemVal = typeof item === 'object' ? item.value : item;
    if (!value) return false;
    if (multi) {
      const parts = String(value)
        .split(',')
        .map((s) => s.trim().toLowerCase());
      return parts.includes(String(itemVal).toLowerCase());
    }
    return String(value).trim().toLowerCase() === String(itemVal).trim().toLowerCase();
  };

  // Active query token for filtering
  const currentToken = multi
    ? String(value || '').split(',').pop().trim().toLowerCase()
    : String(value || '').trim().toLowerCase();

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter((item) => {
    if (!currentToken) return true;
    const itemVal = typeof item === 'object' ? (item.value || '') : String(item);
    const itemLabel = typeof item === 'object' ? (item.label || '') : String(item);
    const itemDesc = typeof item === 'object' ? (item.description || '') : '';
    return (
      itemVal.toLowerCase().includes(currentToken) ||
      itemLabel.toLowerCase().includes(currentToken) ||
      itemDesc.toLowerCase().includes(currentToken)
    );
  });

  // Select a suggestion
  const handleSelect = (item) => {
    const itemVal = typeof item === 'object' ? item.value : item;

    if (multi) {
      let parts = String(value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const existingIdx = parts.findIndex(
        (p) => p.toLowerCase() === String(itemVal).toLowerCase()
      );

      if (existingIdx >= 0) {
        // Toggle off if already selected
        parts.splice(existingIdx, 1);
      } else {
        // If the last part in input was a partial match for this item, replace that partial part
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1].toLowerCase();
          const isExactMatch = suggestions.some(
            (s) => (typeof s === 'object' ? s.value : s).toLowerCase() === lastPart
          );
          if (!isExactMatch && String(itemVal).toLowerCase().includes(lastPart)) {
            parts.pop();
          }
        }
        parts.push(itemVal);
      }

      const nextValue = parts.join(', ');
      onChange({ target: { name, value: nextValue } });
    } else {
      onChange({ target: { name, value: itemVal } });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange({ target: { name, value: '' } });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 mb-4 relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
          <span className="flex items-center gap-1">
            {label}
            {required && <span className="text-error">*</span>}
          </span>
          {suggestions.length > 0 && (
            <span className="text-[10px] text-primary/80 font-normal flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">tips_and_updates</span>
              suggestions available
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          required={required}
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          autoComplete="off"
          className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} pr-16 py-2.5 bg-surface-container-lowest border ${
            error
              ? 'border-error focus:ring-error/20'
              : 'border-outline-variant focus:border-primary focus:ring-primary/15'
          } rounded-xl text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-3 transition`}
        />

        {/* Action icons on right */}
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              title="Clear field"
              className="p-1 rounded-full text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          )}

          {/* Dropdown Toggle Chevron */}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? 'Close suggestions' : 'Open suggestions'}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-200 block">
              {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
            </span>
          </button>
        </div>

        {/* ── Suggestions Dropdown Menu ────────────────────────────────────────── */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto animate-dropdown">
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-outline-variant/40">
                <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70">
                  {multi ? 'Select Suggestions (click to toggle)' : 'Choose an Option or Type Custom'}
                </span>
                <span className="text-[10px] text-on-surface-variant/60">
                  {filteredSuggestions.length} option{filteredSuggestions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredSuggestions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-on-surface-variant">
                  No suggestions matching &ldquo;{currentToken}&rdquo;. You can keep your custom entry!
                </div>
              ) : (
                filteredSuggestions.map((item, idx) => {
                  const itemVal = typeof item === 'object' ? item.value : item;
                  const itemLabel = typeof item === 'object' ? item.label : item;
                  const itemDesc = typeof item === 'object' ? item.description : null;
                  const itemIcon = typeof item === 'object' ? item.icon : null;
                  const selected = isItemSelected(item);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-on-surface hover:bg-surface-container hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {itemIcon && (
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                            selected ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <span className="material-symbols-outlined text-[16px]">{itemIcon}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{itemLabel}</p>
                          {itemDesc && (
                            <p className="text-[10px] text-on-surface-variant truncate font-normal">
                              {itemDesc}
                            </p>
                          )}
                        </div>
                      </div>
                      {selected ? (
                        <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">
                          check_circle
                        </span>
                      ) : (
                        multi && (
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 flex-shrink-0">
                            add
                          </span>
                        )
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Optional Quick Click Chips */}
      {chips && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {suggestions.slice(0, maxChips).map((item, idx) => {
            const itemVal = typeof item === 'object' ? item.value : item;
            const selected = isItemSelected(item);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                  selected
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/70 text-on-surface-variant hover:text-on-surface hover:border-primary/50 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {selected ? 'check' : 'add'}
                </span>
                {itemVal}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-error font-medium flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-xs text-on-surface-variant mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default SuggestionInput;

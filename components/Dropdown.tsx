import React, { useEffect, useMemo, useState } from 'react';

export type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
};

type DropdownProps = {
  name?: string;
  value: string;
  placeholder?: string;
  options: DropdownOption[];
  disabled?: boolean;
  buttonClassName?: string;
  menuClassName?: string;
  onValueChange: (value: string) => void;
  renderValue?: (value: string, option: DropdownOption | undefined) => React.ReactNode;
};

export const Dropdown: React.FC<DropdownProps> = ({
  name,
  value,
  placeholder = 'Selecione',
  options,
  disabled,
  buttonClassName = '',
  menuClassName = '',
  onValueChange,
  renderValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      return;
    }
    const timer = setTimeout(() => setIsRendered(false), 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <div className="relative">
      {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
      <button
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={buttonClassName}
      >
        {value ? (
          renderValue ? (
            renderValue(value, selected)
          ) : (
            <span className="flex items-center gap-2 text-text-main-light dark:text-white font-medium min-w-0">
              {selected?.icon ? (
                <span className="material-symbols-outlined text-primary text-[20px]">{selected.icon}</span>
              ) : null}
              <span className="truncate">{selected?.label ?? value}</span>
            </span>
          )
        ) : (
          <span className="text-text-sub-light dark:text-slate-500">{placeholder}</span>
        )}
        <span
          className={`material-symbols-outlined text-text-sub-light transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {isRendered ? (
        <div
          className={`absolute top-full left-0 w-full mt-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto transition-all duration-200 origin-top ${
            isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
          } ${menuClassName}`}
          role="listbox"
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={value === option.value}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 bg-white dark:bg-surface-dark ${
                value === option.value
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {option.icon ? (
                <span
                  className={`material-symbols-outlined text-[20px] ${value === option.value ? 'text-primary' : 'text-slate-400'}`}
                >
                  {option.icon}
                </span>
              ) : null}
              <span className="font-medium">{option.label}</span>
              {value === option.value ? (
                <span className="material-symbols-outlined text-primary text-[18px] ml-auto">check</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

type DropdownFieldProps = Omit<DropdownProps, 'buttonClassName'> & {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  labelClassName?: string;
  buttonClassName: string;
};

export const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  required,
  error,
  wrapperClassName = 'flex flex-col flex-1',
  wrapperStyle,
  labelClassName = 'text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2',
  buttonClassName,
  ...dropdownProps
}) => {
  return (
    <label className={wrapperClassName} style={wrapperStyle}>
      <p className={labelClassName}>
        {label} {required ? <span className="text-red-500">*</span> : null}
      </p>
      <Dropdown {...dropdownProps} buttonClassName={buttonClassName} />
      {error ? <p className="text-red-500 text-xs mt-1 font-medium">{error}</p> : null}
    </label>
  );
};

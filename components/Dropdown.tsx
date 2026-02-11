import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({
          position: 'absolute',
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
          zIndex: 9999,
        });
      }
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({
          position: 'absolute',
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
          zIndex: 9999,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <>
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onMouseDown={() => setIsOpen(false)}
            aria-hidden="true"
          />,
          document.body
        )}
      <button
        ref={buttonRef}
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${buttonClassName} ${isOpen ? 'relative z-[9999]' : ''}`}
      >
        {value ? (
          renderValue ? (
            renderValue(value, selected)
          ) : (
            <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium min-w-0">
              {selected?.icon ? (
                <span className="material-symbols-outlined text-primary text-[22px]">{selected.icon}</span>
              ) : null}
              <span className="truncate">{selected?.label ?? value}</span>
            </span>
          )
        ) : (
          <span className="text-slate-400 dark:text-slate-500 font-normal">{placeholder}</span>
        )}
        <span
          className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        >
          expand_more
        </span>
      </button>

      {isRendered &&
        createPortal(
          <div
            style={menuStyle}
            className={`!bg-white dark:!bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top ${
              isOpen
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
            } ${menuClassName}`}
            role="listbox"
          >
            <div className="max-h-[280px] overflow-y-auto py-1 custom-scrollbar">
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={value === option.value}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-4 ${
                    value === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {option.icon ? (
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        value === option.value ? 'text-primary' : 'text-slate-400'
                      }`}
                    >
                      {option.icon}
                    </span>
                  ) : null}
                  <span className={`font-medium ${value === option.value ? 'font-semibold' : ''}`}>{option.label}</span>
                  {value === option.value ? (
                    <span className="material-symbols-outlined text-primary text-[18px] ml-auto">check</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
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
    <div className={wrapperClassName} style={wrapperStyle}>
      <p className={labelClassName}>
        {label} {required ? <span className="text-red-500">*</span> : null}
      </p>
      <Dropdown {...dropdownProps} buttonClassName={buttonClassName} />
      {error ? <p className="text-red-500 text-xs mt-1 font-medium">{error}</p> : null}
    </div>
  );
};

/**
 * Currency Input component for monetary values with formatting
 */

import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { DollarSign } from 'lucide-react';

interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  error?: string;
  helperText?: string;
  currency?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      helperText,
      currency = 'USD',
      className = '',
      onBlur,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState('');

    const formatCurrency = (value: string) => {
      if (!value) return '';
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value);
      setDisplayValue(formatted);
      if (onBlur) onBlur(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setDisplayValue('');
    };

    const getBorderColor = () => {
      if (error) return 'border-danger-500 focus:border-danger-500';
      return 'border-neutral-200 focus:border-primary-500';
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 flex items-center pointer-events-none">
            <DollarSign size={18} />
          </div>
          <input
            ref={ref}
            type="number"
            step="0.01"
            min="0"
            className={`w-full pl-10 pr-16 py-2.5 border-2 rounded-lg font-mono transition-all focus:outline-none ${getBorderColor()} bg-white text-neutral-800 placeholder:text-neutral-400 disabled:bg-neutral-50 disabled:cursor-not-allowed ${className}`}
            onBlur={handleBlur}
            onFocus={handleFocus}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 flex items-center pointer-events-none">
            <span className="text-sm font-semibold">{currency}</span>
          </div>
          {displayValue && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
              {displayValue}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

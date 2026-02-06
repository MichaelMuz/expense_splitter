/**
 * Reusable Input component with icon support and enhanced states
 */

import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      success = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2.5 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const getBorderColor = () => {
      if (error) return 'border-danger-500 focus:border-danger-500';
      if (success) return 'border-success-500 focus:border-success-500';
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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full ${sizeStyles[size]} border-2 rounded-lg transition-all focus:outline-none ${getBorderColor()} bg-white text-neutral-800 placeholder:text-neutral-400 disabled:bg-neutral-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 flex items-center pointer-events-none">
              {rightIcon}
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

Input.displayName = 'Input';

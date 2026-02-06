/**
 * Reusable Button component with animations and icon support
 */

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { tapScale } from '../../utils/animations';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles = {
    primary:
      'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary:
      'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400 shadow-sm',
    danger:
      'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:ring-danger-500 shadow-sm hover:shadow-md',
    ghost:
      'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400',
    outline:
      'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    icon: 20,
  };

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      whileTap={disabled || isLoading ? undefined : tapScale}
      {...props}
    >
      {isLoading && <Loader2 size={iconSizes[size]} className="animate-spin" />}
      {!isLoading && leftIcon && (
        <span className="flex items-center" style={{ fontSize: 0 }}>
          {leftIcon}
        </span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="flex items-center" style={{ fontSize: 0 }}>
          {rightIcon}
        </span>
      )}
    </motion.button>
  );
}

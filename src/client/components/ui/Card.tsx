/**
 * Reusable Card component with variants and hover effects
 */

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { hoverLift, hoverGlow } from '../../utils/animations';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const variantStyles = {
    default: 'bg-white shadow-sm',
    bordered: 'bg-white border-2 border-neutral-200',
    elevated: 'bg-white shadow-lg',
    interactive: 'bg-white shadow-md cursor-pointer transition-shadow',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseStyles = `rounded-lg ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

  // Use motion.div for interactive variant or when hover is enabled
  if (variant === 'interactive' || hover || onClick) {
    return (
      <motion.div
        className={baseStyles}
        onClick={onClick}
        whileHover={hover || onClick ? { ...hoverLift, ...hoverGlow } : undefined}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseStyles}>
      {children}
    </div>
  );
}

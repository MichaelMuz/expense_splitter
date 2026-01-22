/**
 * EmptyState component for displaying when there's no data
 */

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      {icon && (
        <div className="mb-4 text-neutral-300">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-neutral-800 mb-2">
        {title}
      </h3>
      <p className="text-neutral-500 mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </motion.div>
  );
}

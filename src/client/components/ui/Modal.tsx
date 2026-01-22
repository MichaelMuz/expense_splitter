/**
 * Reusable Modal component with animations and backdrop blur
 */

import { type ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdrop, modalContent } from '../../utils/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
          />

          {/* Modal content */}
          <motion.div
            className={`relative bg-white rounded-xl shadow-2xl ${sizeStyles[size]} w-full p-6 z-10`}
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Title */}
            {title && (
              <div className="mb-6 pr-8">
                <h2 className="text-2xl font-bold text-neutral-800">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className={!title ? 'pt-6' : ''}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

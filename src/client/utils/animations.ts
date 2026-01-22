import type { Variants, Transition } from 'framer-motion';

/**
 * Animation variants for consistent motion design across the app
 */

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Slide animations
export const slideUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

export const slideInLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

// Scale animations
export const scaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

export const scaleInCenter: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

// Modal/overlay animations
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { scale: 0.95, opacity: 0, y: 10 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.95, opacity: 0, y: 10 },
};

// List/stagger animations
export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItem: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

// Collapse animations
export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

/**
 * Transition configurations for consistent timing
 */

export const transitions = {
  // Fast transitions for micro-interactions
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  } as Transition,

  // Base transition for most animations
  base: {
    duration: 0.25,
    ease: [0.4, 0.0, 0.2, 1], // Custom easing curve
  } as Transition,

  // Slow transitions for larger movements
  slow: {
    duration: 0.4,
    ease: [0.4, 0.0, 0.2, 1],
  } as Transition,

  // Spring transition for bouncy effects
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  } as Transition,

  // Smooth spring for larger elements
  smoothSpring: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  } as Transition,
};

/**
 * Hover and tap animations for interactive elements
 */

export const hoverScale = {
  scale: 1.02,
  transition: transitions.fast,
};

export const tapScale = {
  scale: 0.98,
  transition: transitions.fast,
};

export const hoverLift = {
  y: -2,
  transition: transitions.fast,
};

export const hoverGlow = {
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  transition: transitions.fast,
};

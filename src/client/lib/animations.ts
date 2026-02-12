import type { Variants, Transition } from 'framer-motion';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

const fastTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

export const hoverLift = {
  y: -2,
  transition: fastTransition,
};

export const hoverGlow = {
  boxShadow:
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  transition: fastTransition,
};

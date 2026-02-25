import type { Variants } from 'framer-motion';

export const pageVariants: Variants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const routeTransitionVariants: Variants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const listVariants: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.06 } },
};

export const listItemVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const fadeInVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
};

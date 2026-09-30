/**
 * Reusable Framer Motion Variants & Animation Utilities
 * Professional skill-based social platform motion system.
 * 
 * Strict Easing: Smooth cubic-bezier curves (no childish bouncing)
 * Hierarchy: SKILLS → PEOPLE → CONTENT → CONNECTION
 */

export const EASE_SMOOTH = [0.16, 1, 0.3, 1];
export const EASE_FAST = [0.2, 0.9, 0.3, 1];

// 0.15s Header entrance
export const headerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.15,
      ease: EASE_SMOOTH,
    },
  },
};

// 0.30s Hero Heading entrance
export const headingVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: 0.3,
      ease: EASE_SMOOTH,
    },
  },
};

// 0.45s Hero Description entrance
export const descriptionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.45,
      ease: EASE_SMOOTH,
    },
  },
};

// 0.55s CTA Buttons entrance
export const ctaVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: 0.55,
      ease: EASE_SMOOTH,
    },
  },
};

// 0.70s Central skill podium/visualization base
export const platformVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: 0.7,
      ease: EASE_SMOOTH,
    },
  },
};

// 0.85s Skill Category Labels (Each directional entrance 500-700ms)
export const skillLabelVariants = {
  // Art: translateX(-20px) → 0
  art: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 0.85, ease: EASE_SMOOTH },
    },
  },
  // Fitness: translateY(-15px) → 0
  fitness: {
    hidden: { opacity: 0, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.92, ease: EASE_SMOOTH },
    },
  },
  // Skill-Based Social: scale(0.96) → 1
  social: {
    hidden: { opacity: 0, scale: 0.96, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.65, delay: 0.85, ease: EASE_SMOOTH },
    },
  },
  // Audio: translateY(-15px) → 0
  audio: {
    hidden: { opacity: 0, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.98, ease: EASE_SMOOTH },
    },
  },
  // Photography: translateX(20px) → 0
  photo: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 1.05, ease: EASE_SMOOTH },
    },
  },
};

// 1.0s People appear: opacity: 0 → 1, translateY(12px) → 0, then STOP! (90-95% static)
export const personVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: 1.0 + i * 0.04,
      ease: EASE_SMOOTH,
    },
  }),
};

// 1.15s Connection lines draw themselves with stroke-dasharray / stroke-dashoffset (1-1.5s)
export const connectionLineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delayOffset = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1.25,
        delay: 1.15 + delayOffset,
        ease: EASE_SMOOTH,
      },
      opacity: {
        duration: 0.3,
        delay: 1.15 + delayOffset,
        ease: 'linear',
      },
    },
  }),
};

// 1.3s Central "Skill Synergy" Card
export const synergyCardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 1.3,
      ease: EASE_SMOOTH,
    },
  },
};

// 1.5s Small social reactions appear
export const socialReactionVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: (delayOffset = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 1.5 + delayOffset,
      ease: EASE_SMOOTH,
    },
  }),
};

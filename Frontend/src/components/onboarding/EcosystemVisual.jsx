import React from 'react';
import { motion } from 'framer-motion';
import { EASE_SMOOTH } from '../motionVariants';

// Floating ecosystem labels echoing the homepage skill network.
// x/y are percentages of the visualization band (viewBox 0 0 100 100).
const NODES = [
  { id: 'tech', label: 'Technology', x: 8, y: 22 },
  { id: 'photo', label: 'Photography', x: 90, y: 16 },
  { id: 'ai', label: 'AI', x: 31, y: 47 },
  { id: 'writing', label: 'Writing', x: 66, y: 36 },
  { id: 'music', label: 'Music', x: 15, y: 46 },
];

// Thin curved connectors between the labels — drawn once on load.
const CURVES = [
  'M 11 23 C 18 32, 25 41, 29 46',
  'M 34 46 C 45 45, 55 39, 63 37',
  'M 69 35 C 78 29, 85 21, 87 17',
  'M 19 47 C 22 47, 26 47, 28 47',
];

const labelVariants = (i) => ({
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.5 + i * 0.09, ease: EASE_SMOOTH },
  },
});

const lineVariants = (i) => ({
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    opacity: 0.6,
    pathLength: 1,
    transition: {
      pathLength: { duration: 1.1, delay: 0.3 + i * 0.12, ease: EASE_SMOOTH },
      opacity: { duration: 0.3, delay: 0.3 + i * 0.12 },
    },
  },
});

/**
 * Subtle EVOLV ecosystem visualization: small floating skill labels connected by
 * thin curved lines, sitting behind the onboarding card inside the purple frame.
 * Decorative only — pointer-events none, drawn once, never continuously animated.
 */
export default function EcosystemVisual() {
  return (
    <div className="eco-layer" aria-hidden="true">
      <svg className="eco-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {CURVES.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="rgba(9, 3, 15, 0.4)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            variants={lineVariants(i)}
            initial="hidden"
            animate="visible"
          />
        ))}
        {NODES.map((n) => (
          <motion.circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r="0.7"
            fill="rgba(9, 3, 15, 0.55)"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
          />
        ))}
      </svg>

      {NODES.map((n, i) => (
        <motion.span
          key={n.id}
          className="eco-label"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          variants={labelVariants(i)}
          initial="hidden"
          animate="visible"
        >
          <span className="eco-dot" />
          {n.label}
        </motion.span>
      ))}
    </div>
  );
}

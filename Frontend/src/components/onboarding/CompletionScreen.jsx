import React from 'react';
import { motion } from 'framer-motion';
import { EASE_SMOOTH } from '../motionVariants';
import { resolvedRole } from './onboardingData';

const SUMMARY_ROWS = [
  {
    label: 'YOUR IDENTITY',
    values: (d) => [resolvedRole(d), d.country].filter(Boolean),
  },
  { label: 'CURIOUS ABOUT', values: (d) => d.curiosities },
  {
    label: 'YOUR SKILLS',
    values: (d) => [...d.skills.canDo, ...d.skills.learning, ...d.skills.wantToImprove],
  },
  { label: 'YOUR FOCUS', values: (d) => d.focusDomains },
];

const STAGGER = (i) => ({
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.05 + i * 0.08, ease: EASE_SMOOTH } },
});

export default function CompletionScreen({ draft, onEnter }) {
  return (
    <div className="completion-body">
      <motion.span className="step-index" variants={STAGGER(0)} initial="hidden" animate="visible">
        COMPLETE
      </motion.span>
      <motion.h2 className="step-heading" variants={STAGGER(1)} initial="hidden" animate="visible">
        You&apos;re ready to EVOLV.
      </motion.h2>
      <motion.p className="step-sub" variants={STAGGER(2)} initial="hidden" animate="visible">
        Your profile is taking shape.
      </motion.p>

      <motion.div className="summary-block" variants={STAGGER(3)} initial="hidden" animate="visible">
        {SUMMARY_ROWS.map(({ label, values }) => {
          const list = values(draft).filter(Boolean);
          return (
            <div key={label} className="pp-row">
              <span className="pp-label">{label}</span>
              <span className="pp-value">{list.length > 0 ? list.slice(0, 6).join(' · ') : '—'}</span>
            </div>
          );
        })}
      </motion.div>

      <motion.button
        type="button"
        className="ob-primary-btn completion-cta"
        onClick={onEnter}
        variants={STAGGER(4)}
        initial="hidden"
        animate="visible"
        whileTap={{ scale: 0.98 }}
      >
        Enter EVOLV →
      </motion.button>
    </div>
  );
}

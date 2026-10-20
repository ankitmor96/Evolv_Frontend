import React from 'react';
import { motion } from 'framer-motion';
import { EASE_SMOOTH } from '../motionVariants';

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
        Your profile is taking shape. Check the preview on the right — that&apos;s how others will see you.
      </motion.p>

      <motion.button
        type="button"
        className="ob-primary-btn completion-cta"
        onClick={onEnter}
        variants={STAGGER(3)}
        initial="hidden"
        animate="visible"
        whileTap={{ scale: 0.98 }}
      >
        Enter EVOLV →
      </motion.button>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { EASE_SMOOTH } from '../motionVariants';
import { authService } from '../../services/authService';

const STAGGER = (i) => ({
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.05 + i * 0.08, ease: EASE_SMOOTH },
  },
});

export default function CompletionScreen({ draft, onEnter, error, submitting, isEdit = false, detail }) {
  return (
    <div className="completion-body">
      <motion.span className="step-index" variants={STAGGER(0)} initial="hidden" animate="visible">
        COMPLETE
      </motion.span>
      <motion.h2 className="step-heading" variants={STAGGER(1)} initial="hidden" animate="visible">
        {isEdit ? 'Review your changes.' : 'You\u2019re ready to EVOLV.'}
      </motion.h2>
      <motion.p className="step-sub" variants={STAGGER(2)} initial="hidden" animate="visible">
        {isEdit
          ? 'Check the preview on the right, then update your profile.'
          : 'Your profile is taking shape. Check the preview on the right \u2014 that\u2019s how others will see you.'}      </motion.p>

      <motion.button
        type="button"
        className="ob-primary-btn completion-cta"
        onClick={onEnter}
        variants={STAGGER(3)}
        disabled={submitting}
        initial="hidden"
        animate="visible"
        whileTap={{ scale: 0.98 }}
      >
        {submitting
          ? (isEdit ? 'Updating…' : 'Entering…')
          : (isEdit ? 'Update Profile ✓' : 'Enter EVOLV →')}      
        </motion.button>

      {error && (
        <>
          <span className="ob-inline-error" role="alert">
            <span className="ob-error-mark" aria-hidden="true">!</span>
            {error}
          </span>
          {detail && (
            <small style={{ display: 'block', marginTop: 6, color: '#77727F', wordBreak: 'break-word' }}>
              Details: {detail}
            </small>
          )}
        </>
      )}
    </div>
  );
}
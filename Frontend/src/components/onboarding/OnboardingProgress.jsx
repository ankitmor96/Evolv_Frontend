import React from 'react';
import { motion } from 'framer-motion';

const STEP_LABELS = ['IDENTITY', 'CURIOSITY', 'SKILLS', 'FOCUS'];

/**
 * EVOLV step system: four compact rounded step tiles on the purple frame.
 * current = dark tile, completed = white tile with purple indicator,
 * upcoming = translucent tile with light border.
 * On narrow screens it collapses to "STEP 01 OF 04 · IDENTITY" plus a slim progress line.
 */
export default function OnboardingProgress({ current, total }) {
  const clamped = Math.min(Math.max(current, 1), total);
  const pct = (clamped / total) * 100;

  return (
    <>
      {/* Desktop / tablet: full tile row */}
      <nav className="ob-steps" aria-label="Onboarding progress">
        {STEP_LABELS.slice(0, total).map((label, i) => {
          const n = i + 1;
          const isDone = n < clamped || current > total;
          const isCurrent = n === clamped && current <= total;
          return (
            <motion.span
              key={label}
              className={`ob-step-tile ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              initial={false}
              animate={isCurrent ? { y: -2 } : { y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="ob-step-num">
                {String(n).padStart(2, '0')}
                {isDone && <span className="ob-step-dot" aria-hidden="true" />}
              </span>
              <span className="ob-step-lbl">{label}</span>
            </motion.span>
          );
        })}
      </nav>

      {/* Mobile: compact counter + slim line */}
      <nav className="ob-steps-compact" aria-label="Onboarding progress">
        <div className="ob-compact-head">
          <span className="ob-compact-count">
            <span className="count-wide">
              {String(clamped).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <span className="count-narrow">
              STEP {String(clamped).padStart(2, '0')} OF {String(total).padStart(2, '0')}
            </span>
          </span>
          <span className="ob-compact-label">{STEP_LABELS[clamped - 1]}</span>
        </div>
        <span className="ob-compact-track">
          <motion.span
            className="ob-compact-fill"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        </span>
      </nav>
    </>
  );
}

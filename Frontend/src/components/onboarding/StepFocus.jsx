import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { EASE_SMOOTH } from '../motionVariants';
import { FOCUS_DOMAINS, FOCUS_DOMAIN_MAX, FOCUS_HINTS, GOAL_MAX } from './onboardingData';

/** Every skill that belongs to at least one of the given domain names. */
function skillsForDomains(names) {
  return new Set(FOCUS_DOMAINS.filter((d) => names.includes(d.name)).flatMap((d) => d.skills));
}

function InlineError({ show, message }) {
  if (!show) return null;
  return (
    <motion.span
      className="ob-inline-error"
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_SMOOTH }}
    >
      {message}
    </motion.span>
  );
}

/**
 * Step 04 — FOCUS.
 *
 * The user picks 1–3 EVOLV domains they're prioritising right now, then can
 * optionally narrow each one down to specific skills inside it.
 */
export default function StepFocus({ draft, setDraft, showErrors }) {
  const domains = draft.focusDomains;
  const atMax = domains.length >= FOCUS_DOMAIN_MAX;
  const blocked = showErrors && domains.length === 0;
  const [limitNotice, setLimitNotice] = useState(false);

  const chosen = FOCUS_DOMAINS.filter((d) => domains.includes(d.name));

  const toggleDomain = (name) => {
    setDraft((d) => {
      if (d.focusDomains.includes(name)) {
        const next = d.focusDomains.filter((x) => x !== name);
        const allowed = skillsForDomains(next);
        // Drop skills that belonged only to the area being removed.
        return { ...d, focusDomains: next, focusSkills: d.focusSkills.filter((s) => allowed.has(s)) };
      }
      if (d.focusDomains.length >= FOCUS_DOMAIN_MAX) return d;
      return { ...d, focusDomains: [...d.focusDomains, name] };
    });
    setLimitNotice(false);
  };

  const handleDomainClick = (name) => {
    if (!domains.includes(name) && atMax) {
      setLimitNotice(true);
      return;
    }
    toggleDomain(name);
  };

  const toggleSkill = (skill) => {
    setDraft((d) => ({
      ...d,
      focusSkills: d.focusSkills.includes(skill)
        ? d.focusSkills.filter((s) => s !== skill)
        : [...d.focusSkills, skill],
    }));
  };

  return (
    <div className="step-body">
      <span className="step-index">STEP 04 — FOCUS</span>
      <h2 className="step-heading">What are you focusing on?</h2>
      <p className="step-sub">Choose the areas you want to focus on right now.</p>

      <div className="focus-grid" role="group" aria-label="Areas you are focusing on">
        {FOCUS_DOMAINS.map((domain) => {
          const selected = domains.includes(domain.name);
          const capped = !selected && atMax;
          return (
            <motion.button
              key={domain.id}
              type="button"
              className={`focus-card ${selected ? 'selected' : ''} ${capped ? 'capped' : ''}`}
              onClick={() => handleDomainClick(domain.name)}
              aria-pressed={selected}
              whileTap={{ scale: 0.98 }}
            >
              <span className="chip-check" aria-hidden="true">
                {selected && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="focus-card-label">{domain.name}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="step-footer-meta">
        <span className="counter-hint">
          Choose 1–{FOCUS_DOMAIN_MAX} areas that genuinely fit right now.
        </span>
      </div>

      <InlineError show={limitNotice} message={`Choose up to ${FOCUS_DOMAIN_MAX} areas to focus on.`} />

      {chosen.length > 0 ? (
        <div className="focus-details">
          {chosen.map((domain) => (
            <section key={domain.id} className="focus-detail">
              <div className="focus-detail-head">
                <span className="domain-dot" aria-hidden="true" />
                <span className="focus-detail-title">
                  What are you focusing on within {domain.label}?
                </span>
                <span className="focus-detail-tag">OPTIONAL</span>
              </div>

              <div className="domain-skill-row">
                {domain.skills.map((skill) => {
                  const on = draft.focusSkills.includes(skill);
                  return (
                    <motion.button
                      key={skill}
                      type="button"
                      className={`ob-chip domain-skill ${on ? 'selected' : ''}`}
                      onClick={() => toggleSkill(skill)}
                      aria-pressed={on}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="chip-check" aria-hidden="true">
                        {on && <Check size={12} strokeWidth={3} />}
                      </span>
                      {skill}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="focus-detail-empty">
          Pick an area above to narrow down what you&apos;re focusing on inside it.
        </p>
      )}

      <div className="selection-panel">
        <div className="selection-head">
          <span className="selection-title">FOCUSING ON</span>
          <span className="selection-meta">
            Selected: <strong>{domains.length}</strong> / {FOCUS_DOMAIN_MAX}
          </span>
        </div>

        {domains.length === 0 ? (
          <p className="selection-empty">Nothing picked yet — choose at least one area to continue.</p>
        ) : (
          <div className="selection-chips">
            {domains.map((name) => (
              <span key={name} className="selection-chip">
                {name}
                <button
                  type="button"
                  className="selection-chip-x"
                  onClick={() => toggleDomain(name)}
                  aria-label={`Remove ${name}`}
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <InlineError show={blocked} message="Choose at least one area to focus on." />

      <div className="goal-block">
        <label className="ob-field">
          <span className="ob-field-label">
            WHAT ARE YOU WORKING TOWARD? <span className="ob-field-optional">OPTIONAL</span>
          </span>
          <span className="ob-hint">Tell us what you&apos;re currently working toward.</span>
          <textarea
            className="ob-input ob-textarea"
            placeholder="I want to..."
            rows={2}
            maxLength={GOAL_MAX}
            value={draft.focusGoal}
            onChange={(e) => setDraft((d) => ({ ...d, focusGoal: e.target.value }))}
          />
          <span className="char-count">
            {draft.focusGoal.length} / {GOAL_MAX}
          </span>
        </label>
        <div className="hint-row hint-row-quiet">
          {FOCUS_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              className="hint-chip hint-chip-quiet"
              onClick={() => setDraft((d) => ({ ...d, focusGoal: hint }))}
              tabIndex={-1}
            >
              “{hint}”
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

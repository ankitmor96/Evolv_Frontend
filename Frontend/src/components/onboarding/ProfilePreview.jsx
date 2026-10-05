import React from 'react';
import { motion } from 'framer-motion';
import { EASE_SMOOTH } from '../motionVariants';
import { FOCUS_DOMAINS, resolvedRole } from './onboardingData';

const ROW = {
  hidden: { opacity: 0, y: 6 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: EASE_SMOOTH },
  }),
};

function Row({ label, values, quote }) {
  if (!values || values.length === 0) return null;
  return (
    <motion.div className="pp-row" variants={ROW} initial="hidden" animate="visible">
      <span className="pp-label">{label}</span>
      <span className={`pp-value ${quote ? 'pp-quote' : ''}`}>
        {quote ? `“${values[0]}”` : values.slice(0, 4).join(' · ')}
        {!quote && values.length > 4 ? ` +${values.length - 4}` : ''}
      </span>
    </motion.div>
  );
}

/**
 * Compact "EVOLV PROFILE" preview that sits beside the form on desktop and
 * below it on mobile. Updates live as the user builds their identity, and
 * simply omits any section the user hasn't filled in yet.
 */
export default function ProfilePreview({ draft }) {
  const role = resolvedRole(draft);
  const hasIdentity = Boolean(draft.username.trim() || draft.name.trim());
  const bioText = (draft.bio ?? draft.focusGoal ?? '').trim();
  const hasContent =
    Boolean(role) ||
    Boolean(draft.country) ||
    draft.curiosities.length > 0 ||
    draft.skills.canDo.length > 0 ||
    draft.skills.learning.length > 0 ||
    draft.focusDomains.length > 0 ||
    bioText.length > 0;

  return (
    <div className="pp-card">
      <div className="pp-head">
        <span className="pp-eyebrow">EVOLVE PROFILE</span>
        <span className="pp-live">
          <span className="pp-live-dot" aria-hidden="true" />
          LIVE
        </span>
      </div>

      <div className="pp-identity">
        <span className="pp-avatar">
          {draft.profilePhoto ? <img src={draft.profilePhoto} alt="" /> : null}
        </span>
        <span className="pp-username">
          {draft.username.trim() ? `@${draft.username.trim()}` : '@username'}
        </span>
      </div>

      {draft.name.trim() && <div className="pp-name">{draft.name.trim()}</div>}
      {role && <div className="pp-name pp-role">{role}</div>}

      <div className="pp-body">
        <Row label="COUNTRY" values={draft.country ? [draft.country] : []} />
        <Row label="CURIOUS ABOUT" values={draft.curiosities} />
        <Row label="I CAN DO" values={draft.skills.canDo} />
        <Row label="I'M LEARNING" values={draft.skills.learning} />
        {draft.focusDomains.length > 0 && (
          <motion.div className="pp-row" variants={ROW} initial="hidden" animate="visible">
            <span className="pp-label">FOCUS</span>
            <div className="pp-focus-list">
              {draft.focusDomains.map((name) => {
                const domain = FOCUS_DOMAINS.find((d) => d.name === name);
                const skills = draft.focusSkills.filter((s) => domain?.skills.includes(s));
                return (
                  <div key={name} className="pp-focus-item">
                    <span className="pp-focus-name">{name}</span>
                    {skills.length > 0 && (
                      <span className="pp-focus-skills">{skills.join(' · ')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        {bioText && <Row label="BIO" values={[bioText]} />}

        {!hasContent && (
          <p className="pp-placeholder">
            {hasIdentity
              ? 'Looking good. Add your curiosities, skills and focus to shape your profile.'
              : 'Your profile will appear here as you build your identity.'}
          </p>
        )}
      </div>
    </div>
  );
}

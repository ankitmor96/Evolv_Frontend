import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EASE_SMOOTH } from '../motionVariants';
import { SKILL_SECTIONS } from './onboardingData';

const EMPTY_INPUTS = { canDo: '', learning: '', wantToImprove: '' };

export default function StepSkills({ draft, setDraft, showErrors }) {
  const [inputs, setInputs] = useState(EMPTY_INPUTS);

  const total =
    draft.skills.canDo.length + draft.skills.learning.length + draft.skills.wantToImprove.length;
  const blocked = showErrors && total === 0;

  const addSkill = (sectionId) => {
    const value = inputs[sectionId].trim();
    if (!value) return;
    setDraft((d) => {
      const list = d.skills[sectionId];
      if (list.some((s) => s.toLowerCase() === value.toLowerCase())) return d; // dedupe
      return { ...d, skills: { ...d.skills, [sectionId]: [...list, value] } };
    });
    setInputs((prev) => ({ ...prev, [sectionId]: '' }));
  };

  const removeSkill = (sectionId, skill) => {
    setDraft((d) => ({
      ...d,
      skills: { ...d.skills, [sectionId]: d.skills[sectionId].filter((s) => s !== skill) },
    }));
  };

  const toggleHint = (sectionId, hint) => {
    setDraft((d) => {
      const list = d.skills[sectionId];
      const has = list.includes(hint);
      if (has) return { ...d, skills: { ...d.skills, [sectionId]: list.filter((s) => s !== hint) } };
      return { ...d, skills: { ...d.skills, [sectionId]: [...list, hint] } };
    });
  };

  return (
    <div className="step-body">
      <span className="step-index">STEP 03 — SKILLS</span>
      <h2 className="step-heading">What can you do?</h2>
      <p className="step-sub">Add what you&apos;re good at, what you&apos;re learning, and what you want to grow.</p>

      <div className="skill-sections">
        {SKILL_SECTIONS.map((section) => {
          const skills = draft.skills[section.id];
          return (
            <section key={section.id} className="skill-section">
              <div className="skill-section-head">
                <div className="skill-section-heading">
                  <h3 className="skill-section-title">{section.title}</h3>
                  <p className="skill-section-sub">{section.sub}</p>
                </div>
                {skills.length > 0 && <span className="skill-count">{skills.length}</span>}
              </div>

              <div className="ob-chip-row">
                {skills.map((skill) => (
                  <motion.span
                    key={skill}
                    className="skill-pill"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, ease: EASE_SMOOTH }}
                  >
                    {skill}
                    <button
                      type="button"
                      className="skill-pill-x"
                      onClick={() => removeSkill(section.id, skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </motion.span>
                ))}
              </div>

              <div className="skill-input-row">
                <input
                  type="text"
                  className="ob-input ob-input-inline"
                  placeholder={section.placeholder}
                  value={inputs[section.id]}
                  onChange={(e) => setInputs((p) => ({ ...p, [section.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(section.id);
                    }
                  }}
                />
                <motion.button
                  type="button"
                  className="add-skill-btn"
                  onClick={() => addSkill(section.id)}
                  disabled={!inputs[section.id].trim()}
                  whileTap={{ scale: 0.97 }}
                >
                  + Add skill
                </motion.button>
              </div>

              <div className="hint-row">
                <span className="hint-label">TRY:</span>
                {section.hints
                  .filter((h) => !skills.includes(h))
                  .map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      className="hint-chip"
                      onClick={() => toggleHint(section.id, hint)}
                    >
                      {hint}
                    </button>
                  ))}
              </div>
            </section>
          );
        })}
      </div>

      {blocked && (
        <motion.span
          className="ob-inline-error"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_SMOOTH }}
        >
          Add at least one skill — something you can do, are learning, or want to get better at.
        </motion.span>
      )}
    </div>
  );
}

// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { X } from 'lucide-react';
// import { EASE_SMOOTH } from '../motionVariants';
// import { SKILL_SECTIONS } from './onboardingData';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, Search, X } from 'lucide-react';
import { EASE_SMOOTH } from '../motionVariants';
import {
  CURIOSITY_DOMAINS,
  DEFAULT_EXPANDED_DOMAINS,
  SKILL_SECTIONS,
} from './onboardingData';

const norm = (s) => s.trim().toLowerCase();

const SHORT = {
  canDo: 'CAN DO',
  learning: 'LEARNING',
  wantToImprove: 'IMPROVE',
};

// const EMPTY_INPUTS = { canDo: '', learning: '', wantToImprove: '' };

// export default function StepSkills({ draft, setDraft, showErrors }) {
//   const [inputs, setInputs] = useState(EMPTY_INPUTS);

//   const total =
//     draft.skills.canDo.length + draft.skills.learning.length + draft.skills.wantToImprove.length;
//   const blocked = showErrors && total === 0;

//   const addSkill = (sectionId) => {
//     const value = inputs[sectionId].trim();
//     if (!value) return;
//     setDraft((d) => {
//       const list = d.skills[sectionId];
//       if (list.some((s) => s.toLowerCase() === value.toLowerCase())) return d; // dedupe
//       return { ...d, skills: { ...d.skills, [sectionId]: [...list, value] } };
//     });
//     setInputs((prev) => ({ ...prev, [sectionId]: '' }));
//   };

//   const removeSkill = (sectionId, skill) => {
//     setDraft((d) => ({
//       ...d,
//       skills: { ...d.skills, [sectionId]: d.skills[sectionId].filter((s) => s !== skill) },
//     }));
//   };

//   const toggleHint = (sectionId, hint) => {
//     setDraft((d) => {
//       const list = d.skills[sectionId];
//       const has = list.includes(hint);
//       if (has) return { ...d, skills: { ...d.skills, [sectionId]: list.filter((s) => s !== hint) } };
//       return { ...d, skills: { ...d.skills, [sectionId]: [...list, hint] } };
//     });
//   };

//   return (
//     <div className="step-body">
//       <span className="step-index">STEP 03 — SKILLS</span>
//       <h2 className="step-heading">What can you do?</h2>
//       <p className="step-sub">Add what you&apos;re good at, what you&apos;re learning, and what you want to grow.</p>

//       <div className="skill-sections">
//         {SKILL_SECTIONS.map((section) => {
//           const skills = draft.skills[section.id];
//           return (
//             <section key={section.id} className="skill-section">
//               <div className="skill-section-head">
//                 <div className="skill-section-heading">
//                   <h3 className="skill-section-title">{section.title}</h3>
//                   <p className="skill-section-sub">{section.sub}</p>
//                 </div>
//                 {skills.length > 0 && <span className="skill-count">{skills.length}</span>}
//               </div>

//               <div className="ob-chip-row">
//                 {skills.map((skill) => (
//                   <motion.span
//                     key={skill}
//                     className="skill-pill"
//                     initial={{ opacity: 0, scale: 0.95 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     transition={{ duration: 0.18, ease: EASE_SMOOTH }}
//                   >
//                     {skill}
//                     <button
//                       type="button"
//                       className="skill-pill-x"
//                       onClick={() => removeSkill(section.id, skill)}
//                       aria-label={`Remove ${skill}`}
//                     >
//                       <X size={10} strokeWidth={2.5} />
//                     </button>
//                   </motion.span>
//                 ))}
//               </div>

//               <div className="skill-input-row">
//                 <input
//                   type="text"
//                   className="ob-input ob-input-inline"
//                   placeholder={section.placeholder}
//                   value={inputs[section.id]}
//                   onChange={(e) => setInputs((p) => ({ ...p, [section.id]: e.target.value }))}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       addSkill(section.id);
//                     }
//                   }}
//                 />
//                 <motion.button
//                   type="button"
//                   className="add-skill-btn"
//                   onClick={() => addSkill(section.id)}
//                   disabled={!inputs[section.id].trim()}
//                   whileTap={{ scale: 0.97 }}
//                 >
//                   + Add skill
//                 </motion.button>
//               </div>

//               <div className="hint-row">
//                 <span className="hint-label">TRY:</span>
//                 {section.hints
//                   .filter((h) => !skills.includes(h))
//                   .map((hint) => (
//                     <button
//                       key={hint}
//                       type="button"
//                       className="hint-chip"
//                       onClick={() => toggleHint(section.id, hint)}
//                     >
//                       {hint}
//                     </button>
//                   ))}
//               </div>
//             </section>
//           );
//         })}
//       </div>

//       {blocked && (
//         <motion.span
//           className="ob-inline-error"
//           initial={{ opacity: 0, y: -3 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.2, ease: EASE_SMOOTH }}
//         >
//           Add at least one skill — something you can do, are learning, or want to get better at.
//         </motion.span>
//       )}
//     </div>
//   );
// }


export default function StepSkills({ draft, setDraft, showErrors }) {
  const [active, setActive] = useState('canDo');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(
    () =>
      new Set([
        ...DEFAULT_EXPANDED_DOMAINS,
        ...CURIOSITY_DOMAINS.filter((d) =>
          d.skills.some((s) =>
            SKILL_SECTIONS.some((sec) => draft.skills[sec.id].includes(s))
          )
        ).map((d) => d.id),
      ])
  );

  const total = SKILL_SECTIONS.reduce((n, s) => n + draft.skills[s.id].length, 0);
  const blocked = showErrors && total === 0;
  const activeSection = SKILL_SECTIONS.find((s) => s.id === active);

  // which list a skill is currently in (or null)
  const bucketOf = (skill) =>
    SKILL_SECTIONS.find((s) => draft.skills[s.id].includes(skill))?.id ?? null;

  // Tap a skill: add to the active list, remove if already there,
  // or move it if it was in another list.
  const pick = (skill) => {
    setDraft((d) => {
      const next = {
        canDo: [...d.skills.canDo],
        learning: [...d.skills.learning],
        wantToImprove: [...d.skills.wantToImprove],
      };
      if (next[active].includes(skill)) {
        next[active] = next[active].filter((s) => s !== skill);
      } else {
        SKILL_SECTIONS.forEach((s) => {
          next[s.id] = next[s.id].filter((x) => x !== skill);
        });
        next[active] = [...next[active], skill];
      }
      return { ...d, skills: next };
    });
  };

  const remove = (sectionId, skill) =>
    setDraft((d) => ({
      ...d,
      skills: { ...d.skills, [sectionId]: d.skills[sectionId].filter((s) => s !== skill) },
    }));

  const toggleDomain = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const q = norm(query);
  const searching = q.length > 0;
  const groups = CURIOSITY_DOMAINS.map((domain) => ({
    ...domain,
    visible: !searching
      ? domain.skills
      : norm(domain.label).includes(q)
        ? domain.skills
        : domain.skills.filter((s) => norm(s).includes(q)),
  })).filter((d) => d.visible.length > 0);

  return (
    <div className="step-body">
      <span className="step-index">STEP 03 — SKILLS</span>
      <h2 className="step-heading">What can you do?</h2>
      <p className="step-sub">
        Choose a list below, then tap skills to add them. You can switch lists anytime.
      </p>

      {/* ── 3 options ── */}
      <div className="skill-tabs" role="tablist" aria-label="Skill lists">
        {SKILL_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active === s.id}
            className={`skill-tab ${active === s.id ? 'active' : ''}`}
            onClick={() => setActive(s.id)}
          >
            <span className="skill-tab-title">{s.title}</span>
            <span className="skill-tab-count">{draft.skills[s.id].length}</span>
          </button>
        ))}
      </div>
      <p className="skill-tab-sub">{activeSection.sub}</p>

      {/* ── Search ── */}
      <div className="ob-field curiosity-search">
        <span className="ob-field-label">SEARCH SKILLS</span>
        <div className="search-field">
          <span className="search-icon" aria-hidden="true">
            <Search size={14} strokeWidth={2.5} />
          </span>
          <input
            type="text"
            className="ob-input search-input"
            placeholder="Search for a skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.length > 0 && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── Domains → skills (from our sheet) ── */}
      {groups.length === 0 ? (
        <p className="search-empty">No skill matches “{query.trim()}”.</p>
      ) : (
        <div className="domain-sections">
          {groups.map((domain) => {
            const open = searching || expanded.has(domain.id);
            const picked = domain.skills.filter((s) => bucketOf(s)).length;
            const head = (
              <>
                <span className="domain-dot" aria-hidden="true" />
                <span className="domain-title">{domain.label}</span>
                {picked > 0 && <span className="domain-count">{picked} selected</span>}
                <span className="domain-toggle" aria-hidden="true">
                  {open ? <Minus size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                </span>
              </>
            );

            return (
              <section key={domain.id} className={`domain-section ${open ? 'open' : ''}`}>
                {searching ? (
                  <div className="domain-head static">{head}</div>
                ) : (
                  <button
                    type="button"
                    className="domain-head"
                    onClick={() => toggleDomain(domain.id)}
                    aria-expanded={open}
                  >
                    {head}
                  </button>
                )}

                <div className="domain-skills">
                  <div className="domain-skills-inner">
                    <div className="domain-skill-row">
                      {domain.visible.map((skill) => {
                        const where = bucketOf(skill);
                        const inActive = where === active;
                        const inOther = where && !inActive;
                        return (
                          <motion.button
                            key={skill}
                            type="button"
                            className={`ob-chip domain-skill ${inActive ? 'selected' : ''} ${inOther ? 'in-other' : ''}`}
                            onClick={() => pick(skill)}
                            aria-pressed={inActive}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span className="chip-check" aria-hidden="true">
                              {inActive && <Check size={12} strokeWidth={3} />}
                            </span>
                            {skill}
                            {inOther && <span className="chip-tag">{SHORT[where]}</span>}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Summary: 3 lists ── */}
      <div className="selection-panel">
        <div className="selection-head">
          <span className="selection-title">YOUR SKILLS</span>
          <span className="selection-meta">
            Total: <strong>{total}</strong>
          </span>
        </div>

        {total === 0 ? (
          <p className="selection-empty">Nothing picked yet — add at least one skill to continue.</p>
        ) : (
          SKILL_SECTIONS.map((s) =>
            draft.skills[s.id].length === 0 ? null : (
              <div key={s.id} className="skill-summary-group">
                <span className="skill-summary-title">{s.title}</span>
                <div className="selection-chips">
                  {draft.skills[s.id].map((skill) => (
                    <motion.span
                      key={skill}
                      className="selection-chip"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18, ease: EASE_SMOOTH }}
                    >
                      {skill}
                      <button
                        type="button"
                        className="selection-chip-x"
                        onClick={() => remove(s.id, skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            )
          )
        )}
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
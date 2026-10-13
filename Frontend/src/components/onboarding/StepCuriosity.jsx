import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, Search, X } from 'lucide-react';
import { EASE_SMOOTH } from '../motionVariants';
import {
  ALL_CURIOSITY_SKILLS,
  CURIOSITY_DOMAINS,
  DEFAULT_EXPANDED_DOMAINS,
  MAX_CURIOSITIES,
  MIN_CURIOSITIES,
} from './onboardingData';

const norm = (s) => s.trim().toLowerCase();

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
 * Step 02 — CURIOSITY.
 *
 * Skills are grouped under the domain they belong to (DOMAIN → SKILLS) instead
 * of one mixed list. Domains are collapsible, searchable by skill, and the
 * selection summary at the bottom always shows exactly what's been picked.
 */
export default function StepCuriosity({ draft, setDraft, showErrors }) {
  const selected = draft.curiosities;
  const count = selected.length;
  const blocked = showErrors && count < MIN_CURIOSITIES;
  const atMax = count >= MAX_CURIOSITIES;

  const [query, setQuery] = useState('');
  // Start open on the most common domains, plus any domain that already holds
  // a restored selection so returning users can see their picks.
  const [expanded, setExpanded] = useState(
    () =>
      new Set([
        ...DEFAULT_EXPANDED_DOMAINS,
        'custom',
        ...CURIOSITY_DOMAINS.filter((d) => d.skills.some((s) => selected.includes(s))).map((d) => d.id),
      ]),
  );

  const q = norm(query);
  const searching = q.length > 0;

  // Custom entries are simply skills that don't belong to a preset domain.
  const customSkills = selected.filter((s) => !ALL_CURIOSITY_SKILLS.includes(s));
  const allGroups =
    customSkills.length > 0
      ? [...CURIOSITY_DOMAINS, { id: 'custom', label: 'CUSTOM', skills: customSkills }]
      : CURIOSITY_DOMAINS;

  const groups = searching
    ? allGroups
        .map((domain) => ({
          ...domain,
          visible: norm(domain.label).includes(q)
            ? domain.skills
            : domain.skills.filter((s) => norm(s).includes(q)),
        }))
        .filter((domain) => domain.visible.length > 0)
    : allGroups.map((domain) => ({ ...domain, visible: domain.skills }));

  const toggle = (skill) => {
    setDraft((d) => {
      if (d.curiosities.includes(skill)) {
        return { ...d, curiosities: d.curiosities.filter((c) => c !== skill) };
      }
      if (d.curiosities.length >= MAX_CURIOSITIES) return d; // hard cap
      return { ...d, curiosities: [...d.curiosities, skill] };
    });
  };

  const toggleDomain = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustom = () => {
    const value = draft.customCuriosity.trim().replace(/\s+/g, ' ');
    if (!value) return;
    // Typing a preset skill name selects that skill instead of duplicating it.
    const canonical = ALL_CURIOSITY_SKILLS.find((s) => norm(s) === norm(value));
    const entry = canonical || value;
    setDraft((d) => {
      if (d.curiosities.some((c) => norm(c) === norm(entry))) return { ...d, customCuriosity: '' };
      if (d.curiosities.length >= MAX_CURIOSITIES) return d;
      return { ...d, curiosities: [...d.curiosities, entry], customCuriosity: '' };
    });
  };

  return (
    <div className="step-body">
      <span className="step-index">STEP 02 — CURIOSITY</span>
      <h2 className="step-heading">What are you curious about?</h2>
      <p className="step-sub">Choose the areas you want to explore, learn about, or understand better.</p>

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

      {groups.length === 0 ? (
        <p className="search-empty">
          No skill matches “{query.trim()}”. Add it as your own below.
        </p>
      ) : (
        <div className="domain-sections">
          {groups.map((domain) => {
            const open = searching || expanded.has(domain.id);
            const picked = domain.skills.filter((s) => selected.includes(s)).length;
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
                  // While searching, matching domains are force-revealed.
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
                        const isSelected = selected.includes(skill);
                        const disabled = !isSelected && atMax;
                        return (
                          <motion.button
                            key={skill}
                            type="button"
                            className={`ob-chip domain-skill ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggle(skill)}
                            disabled={disabled}
                            aria-pressed={isSelected}
                            whileTap={disabled ? undefined : { scale: 0.97 }}
                          >
                            <span className="chip-check" aria-hidden="true">
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </span>
                            {skill}
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

      {/* <div className="custom-input-row">
        <span className="ob-field-label">CAN&apos;T FIND YOUR SKILL?</span>
        <div className="custom-input-controls">
          <input
            type="text"
            className="ob-input ob-input-inline"
            placeholder="Add your own skill"
            value={draft.customCuriosity}
            maxLength={40}
            onChange={(e) => setDraft((d) => ({ ...d, customCuriosity: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <motion.button
            type="button"
            className="add-skill-btn"
            onClick={addCustom}
            disabled={!draft.customCuriosity.trim() || atMax}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={12} strokeWidth={3} aria-hidden="true" /> Add
          </motion.button>
        </div>
      </div> */}

      <div className="selection-panel">
        <div className="selection-head">
          <span className="selection-title">YOUR SELECTION</span>
          <span className="selection-meta">
            Selected: <strong>{count}</strong> / {MAX_CURIOSITIES}
          </span>
        </div>

        {count === 0 ? (
          <p className="selection-empty">
            Nothing picked yet — choose at least {MIN_CURIOSITIES} skills to continue.
          </p>
        ) : (
          <div className="selection-chips">
            {selected.map((skill) => (
              <span key={skill} className="selection-chip">
                {skill}
                <button
                  type="button"
                  className="selection-chip-x"
                  onClick={() => toggle(skill)}
                  aria-label={`Remove ${skill}`}
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="selection-recommend">
          Recommended: 5–8 skills · Minimum {MIN_CURIOSITIES}
        </p>
      </div>

      <InlineError show={blocked} message={`Choose at least ${MIN_CURIOSITIES} skills to continue.`} />
    </div>
  );
}

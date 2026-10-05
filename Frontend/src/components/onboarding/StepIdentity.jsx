import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EASE_SMOOTH } from '../motionVariants';
import { AGE_RANGES, COUNTRIES, GOAL_MAX, ROLES, ROLE_OTHER, validateUsername } from './onboardingData';

function InlineError({ show, message }) {
  if (!show || !message) return null;
  return (
    <motion.span
      className="ob-inline-error"
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_SMOOTH }}
    >
      <span className="ob-error-mark" aria-hidden="true">
        !
      </span>
      {message}
    </motion.span>
  );
}

/**
 * Searchable country combobox — type to filter, click or Enter to pick.
 * Never renders a page-filling list: results scroll inside a 240px panel.
 */
function CountrySelect({ value, onChange, invalid }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  // Close when the user clicks anywhere outside the combobox.
  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  const commit = (country) => {
    onChange(country);
    setQuery(country);
    setOpen(false);
  };

  const handleChange = (text) => {
    setQuery(text);
    setHighlight(0);
    setOpen(true);
    // Typing invalidates a previous selection unless it still matches exactly.
    if (value && text !== value) onChange('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && results[highlight]) {
        e.preventDefault();
        commit(results[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="country-select" ref={wrapRef}>
      <input
        type="text"
        className={`ob-input country-input ${invalid ? 'invalid' : ''}`}
        placeholder="Select your country"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          setHighlight(0);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls="ob-country-list"
        aria-autocomplete="list"
        autoComplete="off"
      />

      {open && (
        <ul className="country-list" id="ob-country-list" role="listbox">
          {results.length === 0 ? (
            <li className="country-empty">No country matches “{query.trim()}”.</li>
          ) : (
            results.map((country, i) => {
              const selected = country === value;
              return (
                <li key={country}>
                  <button
                    type="button"
                    className={`country-option ${i === highlight ? 'highlight' : ''} ${
                      selected ? 'selected' : ''
                    }`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => commit(country)}
                    role="option"
                    aria-selected={selected}
                  >
                    <span>{country}</span>
                    {selected && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default function StepIdentity({ draft, setDraft, showErrors }) {
  const inputRef = useRef(null);

  const nameError = showErrors && draft.name.trim().length === 0;
  const usernameError = validateUsername(draft.username);
  const showUsernameError = showErrors && (draft.username.trim().length === 0 || usernameError);
  const roleError = showErrors && !draft.role;
  const customRoleError = showErrors && draft.role === ROLE_OTHER && draft.customRole.trim().length === 0;
  const countryError = showErrors && draft.country.trim().length === 0;

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, profilePhoto: reader.result }));
    reader.readAsDataURL(file);
  };

  const pickRole = (role) => {
    setDraft((d) => ({ ...d, role, customRole: role === ROLE_OTHER ? d.customRole : '' }));
  };

  return (
    <div className="step-body">
      <span className="step-index">STEP 01 — IDENTITY</span>
      <h2 className="step-heading">Who are you?</h2>
      <p className="step-sub">Start with the basics. You can change these anytime.</p>

      <div className="step-form">
        <div className="identity-row">
          <button
            type="button"
            className="photo-circle"
            onClick={() => inputRef.current?.click()}
            aria-label={draft.profilePhoto ? 'Change profile photo' : 'Add profile photo'}
          >
            {draft.profilePhoto ? (
              <img src={draft.profilePhoto} alt="Profile" />
            ) : (
              <span className="photo-plus">+ Add photo</span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only-input"
            onChange={handlePhoto}
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="identity-fields">
            <label className="ob-field">
              <span className="ob-field-label">FULL NAME</span>
              <input
                type="text"
                className="ob-input"
                placeholder="Your name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
              <InlineError show={!!nameError} message="Please tell us your name." />
            </label>

            <label className="ob-field">
              <span className="ob-field-label">USERNAME</span>
              <input
                type="text"
                className="ob-input"
                placeholder="@username"
                value={draft.username}
                onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value.replace(/\s/g, '') }))}
              />
              <InlineError
                show={!!showUsernameError}
                message={
                  draft.username.trim().length === 0
                    ? 'Pick a username so people can find you.'
                    : usernameError || ''
                }
              />
            </label>
            <p className="ob-hint">Your username is how people will find you.</p>
          </div>
        </div>

        {/* ─── WHAT DESCRIBES YOU RIGHT NOW? ─── */}
        <div className="ob-field role-field">
          <span className="ob-field-label">WHAT DESCRIBES YOU RIGHT NOW?</span>
          <div className="ob-chip-row" role="group" aria-label="What describes you right now">
            {ROLES.map((role) => {
              const selected = draft.role === role;
              return (
                <motion.button
                  key={role}
                  type="button"
                  className={`ob-chip ${selected ? 'selected' : ''}`}
                  onClick={() => pickRole(role)}
                  aria-pressed={selected}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="chip-check" aria-hidden="true">
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                  {role}
                </motion.button>
              );
            })}
          </div>

          {draft.role === ROLE_OTHER && (
            <motion.div
              className="role-other"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE_SMOOTH }}
            >
              <input
                type="text"
                className="ob-input"
                placeholder="Tell us what describes you..."
                value={draft.customRole}
                onChange={(e) => setDraft((d) => ({ ...d, customRole: e.target.value }))}
              />
            </motion.div>
          )}

          <InlineError show={!!roleError} message="Pick the one that fits best." />
          <InlineError show={!!customRoleError} message="Tell us what describes you." />
        </div>

        <div className="identity-row-secondary">
          <div className="ob-field">
            <span className="ob-field-label">COUNTRY</span>
            <CountrySelect
              value={draft.country}
              onChange={(country) => setDraft((d) => ({ ...d, country }))}
              invalid={!!countryError}
            />
            <InlineError show={!!countryError} message="Select your country." />
          </div>

          <div className="ob-field">
            <span className="ob-field-label">AGE RANGE</span>
            <div className="ob-chip-row" role="group" aria-label="Age range">
              {AGE_RANGES.map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  className={`ob-chip ${draft.ageRange === r ? 'selected' : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, ageRange: draft.ageRange === r ? '' : r }))}
                  whileTap={{ scale: 0.98 }}
                >
                  {r}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── BIO (moved from Step 04) ─── */}
        <div className="goal-block">
          <label className="ob-field">
            <span className="ob-field-label">
              BIO<span className="ob-field-optional">OPTIONAL</span>
            </span>
            <span className="ob-hint">Tell us about yourself</span>
            <textarea
              className="ob-input ob-textarea"
              placeholder="my name is..."
              rows={3}
              maxLength={GOAL_MAX}
              value={draft.bio ?? draft.focusGoal ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setDraft((d) => ({ ...d, bio: value, focusGoal: value }));
              }}
            />
            <span className="char-count">
              {(draft.bio ?? draft.focusGoal ?? '').length} / {GOAL_MAX}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

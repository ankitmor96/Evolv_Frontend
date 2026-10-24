import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HeroHeader from '../HeroHeader';
import { EASE_SMOOTH } from '../motionVariants';
import OnboardingProgress from './OnboardingProgress';
import EcosystemVisual from './EcosystemVisual';
import ProfilePreview from './ProfilePreview';
import StepIdentity from './StepIdentity';
import StepCuriosity from './StepCuriosity';
import StepSkills from './StepSkills';
import { guardOnboardingRoute } from '../../services/sessionService.js';
import CompletionScreen from './CompletionScreen';
import {
  initialProfile,
  isStepComplete,
  MIN_CURIOSITIES,
  ROLE_OTHER,
  validateUsername,
} from './onboardingData';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';

const CRITICAL_SECTIONS = ['auth', 'profile', 'avatar', 'identity', 'curiosity'];

const TOTAL_STEPS = 3;
const DRAFT_KEY = 'evolve-onboarding-draft';

/**
 * Rehydrate a saved draft defensively: only known keys are read, arrays stay
 * arrays. Older drafts saved against the previous 5-step shape are ignored
 * rather than leaking stale fields into the new model.
 */
function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        const list = (v) => (Array.isArray(v) ? v : []);
        const text = (v) => (typeof v === 'string' ? v : '');
        return {
          name: text(saved.name),
          username: text(saved.username),
          profilePhoto: typeof saved.profilePhoto === 'string' ? saved.profilePhoto : null,
          // File objects cannot be serialised — always start with null on reload.
          // The user must re-select a photo if they reload mid-onboarding.
          profilePhotoFile: null,
          role: text(saved.role),
          customRole: text(saved.customRole),
          country: text(saved.country),
          ageRange: text(saved.ageRange),
          curiosities: list(saved.curiosities),
          customCuriosity: text(saved.customCuriosity),
          skills: {
            canDo: list(saved.skills?.canDo),
            learning: list(saved.skills?.learning),
            wantToImprove: list(saved.skills?.wantToImprove),
          },
          focusDomains: list(saved.focusDomains),
          focusSkills: list(saved.focusSkills),
          focusGoal: text(saved.focusGoal || saved.bio),
          bio: text(saved.bio || saved.focusGoal),
        };
      }
    }
  } catch {
    /* corrupted draft — start fresh */
  }
  return initialProfile;
}

const STEP_COMPONENTS = {
  1: StepIdentity,
  2: StepCuriosity,
  3: StepSkills,
};

/** Calm, inline reason why Continue is locked. No browser alerts. */
function getGateReason(step, draft) {
  switch (step) {
    case 1: {
      if (draft.name.trim().length === 0) return 'Your name is needed to continue.';
      if (draft.username.trim().length === 0) return 'Pick a username to continue.';
      const err = validateUsername(draft.username);
      if (err) return `Username: ${err.toLowerCase()}`;
      if (!draft.role) return 'Pick what describes you to continue.';
      if (draft.role === ROLE_OTHER && draft.customRole.trim().length === 0)
        return 'Tell us what describes you.';
      if (!draft.country.trim()) return 'Select your country to continue.';
      return null;
    }
    case 2:
      return `Choose at least ${MIN_CURIOSITIES} to continue.`;
    case 3:
      return 'Add at least one skill to continue.';
    default:
      return null;
  }
}

function describeSubmitError(errors = []) {
  const details = errors
    .map((item) => String(item.message || "Unknown error"))
    .join(" ");

  const text = details.toLowerCase();

  if (
    errors.some((item) => item.status === 401 || item.status === 403) ||
    text.includes("auth token") ||
    text.includes("unauthorized") ||
    text.includes("jwt")
  ) {
    return {
      message: "Your session may have expired. Please log in again.",
    };
  }

  if (
    text.includes("username") &&
    /(taken|exist|already|duplicate)/.test(text)
  ) {
    return {
      message: "That username may already be taken. Please choose another.",
      goToStep: 1,
    };
  }

  if (
    text.includes("avatar") ||
    text.includes("profile photo") ||
    text.includes("file") ||
    text.includes("multipart")
  ) {
    return {
      message: "Your profile photo could not be uploaded. Please check the image and try again.",
      goToStep: 1,
    };
  }

  if (
    text.includes("identitytypeids") ||
    text.includes("identity type")
  ) {
    return {
      message: "Your selected role could not be saved. Please check your role.",
      goToStep: 1,
    };
  }

  if (errors.some((item) => item.status === 404)) {
    return {
      message: "A required profile resource was not found. Check the failed API request.",
    };
  }

  if (errors.some((item) => item.status >= 500)) {
    return {
      message: "The server failed to save your profile. Check the backend logs.",
    };
  }

  // Keep the actual details available while debugging.
  return {
    message: details || "Profile save failed. Check the browser Console and Network tabs.",
  };
}

export default function Onboarding() {
  const [step, setStep] = useState(1); // 1–3; 4 = completion
  const [draft, setDraft] = useState(loadDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(true);
  const [checking, setChecking] = useState(true);

  const [submitDetail, setSubmitDetail] = useState('');
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.hash = '/login';
    window.dispatchEvent(new Event('navigated'));
  };

  // Two-phase step transition: leave pose → swap content → enter pose.
  // Deterministic (no presence bookkeeping), matches the homepage motion spec.
  const [phase, setPhase] = useState('idle'); // idle | leaving | entering
  const pendingStepRef = useRef(null);

  // Prevents duplicate submissions if the user taps "Enter EVOLV" more than once.
  const isSubmitting = useRef(false);

  // ─── Draft autosave ────────────────────────────────────────────────────────
  const persistTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    guardOnboardingRoute().then((ok) => {
      if (!cancelled && ok) setChecking(false);
    });
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage unavailable — fail silently */
      }
    }, 400);
    return () => clearTimeout(persistTimer.current);
  }, [draft]);


  const isComplete = step > TOTAL_STEPS;
  const canContinue = isStepComplete(Math.min(step, TOTAL_STEPS), draft);
  const gateReason = getGateReason(step, draft);
  const StepComponent = STEP_COMPONENTS[step] || StepIdentity;

  const goNext = useCallback(() => {
    if (!isStepComplete(step, draft)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    pendingStepRef.current = Math.min(step + 1, TOTAL_STEPS + 1); // 5 = completion
    setPhase('leaving');
  }, [step, draft]);

  const goBack = useCallback(() => {
    setShowErrors(false);
    pendingStepRef.current = Math.max(step - 1, 1);
    setPhase('leaving');
  }, [step]);

  // Phase 1 — hold the leave pose, then swap in the next step content.
  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const id = setTimeout(() => {
      if (pendingStepRef.current !== null) {
        setStep(pendingStepRef.current);
        pendingStepRef.current = null;
      }
      setPhase('entering'); // new content mounts at the entry pose
    }, 240);
    return () => clearTimeout(id);
  }, [phase]);

  // Phase 2 — after the new content mounts off-pose, settle it into place.
  // Timer-driven (not rAF) so content always reaches its final visible pose.
  useEffect(() => {
    if (phase !== 'entering') return undefined;
    const id = setTimeout(() => setPhase('idle'), 30);
    return () => clearTimeout(id);
  }, [phase]);

  const handleEnter = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setSubmitting(true);
    setSubmitError('');
    setSubmitDetail('');

    try {
      const result = await profileService.submitOnboardingDraft(draft, { isEdit });
      const errors = Array.isArray(result?.errors) ? result.errors : [];

      console.table(errors.map(({ section, status, message }) => ({ section, status, message })));

      const critical = errors.filter((item) => CRITICAL_SECTIONS.includes(item.section));

      if (critical.length > 0) {
        console.error('[Onboarding] Profile save failed:', critical);
        const { message, goToStep } = describeSubmitError(critical);
        setSubmitError(message);
        setSubmitDetail(
          critical.map((e) => `[${e.section}] ${e.status ?? '?'}: ${e.message}`).join(' | ')
        );
        if (goToStep) {
          setShowErrors(true);
          setStep(goToStep);
        }
        return;
      }

      // Verify the server really has everything the login check needs
      let status = null;
      try { status = await authService.getOnboardingStatus(); } catch { /* ignore */ }

      if (status) {
        const missing = [];
        if (!status.hasUsername) missing.push('username');
        if (!status.hasAvatar) missing.push('profile photo');
        if (!status.hasRole) missing.push('role');
        if (!status.hasInterests) missing.push('interests');

        if (missing.length > 0) {
          const needsStep1 = !status.hasUsername || !status.hasAvatar || !status.hasRole;
          setSubmitError(
            `Almost there. The server still has no ${missing.join(', ')} for your account. Please add it again.`
          );
          setShowErrors(true);
          setStep(needsStep1 ? 1 : 2);
          return;
        }
      }
    } catch (err) {
      console.error('[Onboarding] Unexpected error:', err);
      setSubmitError('Something went wrong. Please try again.');
      setSubmitDetail(err.message || '');
      return;
    } finally {
      isSubmitting.current = false;
      setSubmitting(false);
    }

    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    window.location.hash = isEdit ? '/profile' : '/explore-gems';
    window.dispatchEvent(new Event('navigated'));
  }, [draft, isEdit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await profileService.loadDraftFromBackend();
        if (cancelled) return;
        if (saved) {
          setDraft(saved);
          setIsEdit(true);
        }
      } catch (err) {
        console.error('[Onboarding] Could not load profile for editing', err);
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  if (checking) return <div>Loading…</div>;

  return (
    <main className="ob-page" role="main">
      <section className="ob-frame" aria-label="Build your EVOLV profile">
        {/* Same navbar as the homepage */}
        <HeroHeader />
        {currentUser && (
          <div className="ob-session-bar" role="status">
            <span>Logged in as <strong>{currentUser.email || currentUser.name}</strong></span>
            <button type="button" onClick={handleLogout}>Log out</button>
          </div>
        )}

        {/* ─── Hero headline ─── */}
        <div className="ob-hero">
          <motion.h1
            key={isComplete ? 'done' : 'build'}
            className="ob-hero-heading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_SMOOTH }}
          >
            {isComplete ? (
              isEdit ? (
                <>Review your<br />changes.</>
              ) : (
                <>You&apos;re ready<br />to EVOLV.</>
              )
            ) : (
              isEdit ? (
                <>Edit your<br />EVOLV identity.</>
              ) : (
                <>Build your<br />EVOLV identity.</>
              )
            )}
          </motion.h1>
          <p className="ob-hero-sub">
            {isComplete
              ? isEdit
                ? 'Almost done. Review and save your updates.'
                : 'Your profile is taking shape.'
              : "Tell us who you are, what you're curious about, and what you're focusing on."}
          </p>
        </div>

        {/* ─── Progress ─── */}
        <OnboardingProgress current={isComplete ? TOTAL_STEPS + 1 : step} total={TOTAL_STEPS} />

        {/* ─── Subtle ecosystem visualization (desktop) ─── */}
        <EcosystemVisual />

        {/* ─── Main white card ─── */}
        <motion.div
          className="ob-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_SMOOTH }}
        >
          <div className="ob-card-grid">
            {/* Form column */}
            <div className="ob-form-col">
              <div className={`ob-step-slot ${phase}`}>
                {loadingEdit ? (
                  <p className="step-sub">Loading your profile…</p>
                ) : isComplete ? (
                  <CompletionScreen draft={draft} onEnter={handleEnter} error={submitError} submitting={submitting} isEdit={isEdit} detail={submitDetail} />
                ) : (
                  <StepComponent draft={draft} setDraft={setDraft} showErrors={showErrors} />
                )}
              </div>
            </div>

            {/* Live profile preview column */}
            <aside className="ob-preview-col">
              <ProfilePreview draft={draft} />
            </aside>
          </div>

          {/* ─── Bottom navigation ─── */}
          {!isComplete && (
            <div className="ob-footer">
              {gateReason && !canContinue && (
                <span className="ob-gate-reason">{gateReason}</span>
              )}
              {submitError && !isComplete && <span className="ob-inline-error" role="alert">{submitError}</span>}
              <motion.button
                type="button"
                className={`ob-primary-btn ${canContinue ? '' : 'disabled'}`}
                onClick={goNext}
                disabled={!canContinue || submitting}
                whileTap={canContinue ? { scale: 0.98 } : undefined}
                aria-busy={submitting}
                aria-disabled={!canContinue || submitting}
              >
                Continue →
              </motion.button>
            </div>
          )}
        </motion.div>
      </section>

      <style>{`
      
        /* ═══════════════════════════════════════════════
           EVOLV ONBOARDING — same shell as the homepage
        ═══════════════════════════════════════════════ */
        .ob-page {
          min-height: 100vh;
          background: var(--color-outer-bg, #F4F3FA);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 20px;
        }
          .ob-session-bar {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 560px;
  margin: 8px auto 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  font-size: 0.78rem;
}
.ob-session-bar button {
  padding: 4px 12px;
  border-radius: 999px;
  border: 2px solid #09030F;
  background: #fff;
  color: #09030F;
  font-weight: 700;
  font-size: 0.72rem;
  cursor: pointer;
}

        .ob-frame {
          width: 100%;
          max-width: 1280px;
          min-height: calc(100vh - 40px);
          background: var(--purple, #A943F5);
          border: 3px solid var(--border, #09030F);
          border-radius: 40px;
          padding: 20px 24px 40px;
          position: relative;
          overflow: hidden;
          box-shadow:
            inset 0 0 0 6px rgba(9, 3, 15, 0.06),
            6px 8px 0 rgba(9, 3, 15, 0.14);
        }

        /* ─── Hero headline ─── */
        .ob-hero {
          position: relative;
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          padding: 26px 16px 22px;
        }

        .ob-hero-heading {
          font-family: var(--font-heading, 'Anton', sans-serif);
          font-size: clamp(2.6rem, 5.2vw, 4.6rem);
          line-height: 1.02;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: var(--white, #FFFFFF);
          margin: 0;
          max-width: 900px;
        }

        .ob-hero-sub {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: clamp(0.9rem, 1.5vw, 1.02rem);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.92);
          max-width: 600px;
          margin: 0;
        }

        /* ─── Progress: compact step tiles ─── */
        .ob-steps {
          position: relative;
          z-index: 6;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          padding: 4px 12px 20px;
        }

        .ob-step-tile {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 112px;
          padding: 9px 14px;
          border-radius: 14px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.12);
          color: var(--white, #FFFFFF);
          transition: background 250ms ease, color 250ms ease, border-color 250ms ease;
        }

        .ob-step-num {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-heading, 'Anton', sans-serif);
          font-size: 0.95rem;
          letter-spacing: 0.06em;
          line-height: 1.1;
        }

        .ob-step-lbl {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .ob-step-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--purple, #A943F5);
        }

        .ob-step-tile.current {
          background: var(--dark, #09030F);
          border-color: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.35);
        }

        .ob-step-tile.done {
          background: var(--white, #FFFFFF);
          border-color: var(--dark, #09030F);
          color: var(--dark, #09030F);
        }

        /* Compact progress (mobile) */
        .ob-steps-compact { display: none; }

        /* ─── Ecosystem visualization ─── */
        .eco-layer {
          position: relative;
          z-index: 1;
          height: 130px;
          margin-bottom: -34px;
          pointer-events: none;
        }

        .eco-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .eco-label {
          position: absolute;
          transform: translate(-50%, -50%);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          border: 2px solid var(--border, #09030F);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--dark, #09030F);
          white-space: nowrap;
          box-shadow: 2px 2px 0 rgba(9, 3, 15, 0.2);
        }

        .eco-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--purple, #A943F5);
        }

        /* ─── Main card ─── */
        .ob-card {
          position: relative;
          z-index: 5;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          background: var(--white, #FFFFFF);
          border: 3px solid var(--border, #09030F);
          border-radius: 30px;
          box-shadow: 4px 5px 0 var(--border, #09030F);
          padding: clamp(22px, 3vw, 38px);
        }

        .ob-card-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(240px, 1fr);
          gap: clamp(22px, 3vw, 40px);
          align-items: start;
        }

        .ob-form-col { min-width: 0; }

        /* Step transition: leave pose → swap → enter pose (deterministic CSS) */
        .ob-step-slot {
          transition:
            opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .ob-step-slot.idle { opacity: 1; transform: translateX(0); }
        .ob-step-slot.leaving { opacity: 0; transform: translateX(-15px); }
        .ob-step-slot.entering {
          transition: none;
          opacity: 0;
          transform: translateX(15px);
        }

        /* ─── Step content ─── */
        .step-index {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: var(--purple, #A943F5);
          background: rgba(169, 67, 245, 0.1);
          border-radius: 999px;
          padding: 5px 11px;
          margin-bottom: 14px;
        }

        .step-heading {
          font-family: var(--font-heading, 'Anton', sans-serif);
          font-size: clamp(1.6rem, 2.6vw, 2.2rem);
          line-height: 1.06;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: var(--dark, #09030F);
          margin: 0;
        }

        .step-sub {
          margin-top: 8px;
          font-size: 0.9rem;
          line-height: 1.6;
          color: #77727F;
          max-width: 460px;
        }

        .step-form,
        .skill-sections { margin-top: 24px; }

        /* ─── Fields ─── */
        .ob-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }

        .ob-field-label {
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          color: var(--dark, #09030F);
        }

        .ob-input {
          width: 100%;
          background: var(--white, #FFFFFF);
          border: 2px solid rgba(9, 3, 15, 0.85);
          border-radius: 12px;
          padding: 11px 14px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--dark, #09030F);
          outline: none;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .ob-input::placeholder { color: #9A95A3; }
        .ob-input:focus {
          border-color: var(--purple, #A943F5);
          box-shadow: 0 0 0 3px rgba(169, 67, 245, 0.16);
        }

        .ob-textarea {
          resize: vertical;
          min-height: 84px;
          line-height: 1.55;
        }

        .ob-hint {
          font-size: 0.72rem;
          color: #77727F;
          margin-top: 2px;
        }

        .char-count {
          font-size: 0.65rem;
          color: #77727F;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .ob-inline-error {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.73rem;
          font-weight: 600;
          color: var(--purple, #A943F5);
          margin-top: 6px;
        }
        .ob-error-mark { opacity: 0.55; }

        /* ─── Chips / pills ─── */
        .ob-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }

        .ob-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 15px;
          background: var(--white, #FFFFFF);
          border: 2px solid rgba(9, 3, 15, 0.85);
          border-radius: 999px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--dark, #09030F);
          cursor: pointer;
          transition:
            background 200ms cubic-bezier(0.16, 1, 0.3, 1),
            color 200ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ob-chip:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 2px 3px 0 rgba(9, 3, 15, 0.18);
        }
        .ob-chip:disabled { cursor: not-allowed; }

        .ob-chip.selected {
          background: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          border-color: var(--dark, #09030F);
          box-shadow: 2px 3px 0 rgba(9, 3, 15, 0.25);
        }

        .ob-chip-lg { padding: 10px 18px; font-size: 0.85rem; }
        .ob-chip-sm { padding: 6px 12px; gap: 5px; font-size: 0.76rem; }

        .chip-check {
          display: inline-flex;
          align-items: center;
          color: var(--purple-light, #C084FC);
          width: 0;
          overflow: hidden;
          transition: width 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ob-chip.selected .chip-check { width: 13px; }

        /* ─── Step 1 layout ─── */
        .identity-row { display: flex; gap: 22px; align-items: flex-start; }

        .photo-circle {
          width: 92px;
          height: 92px;
          border-radius: 50%;
          border: 2px dashed rgba(9, 3, 15, 0.45);
          background: #F7F6FB;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 200ms ease, background 200ms ease, transform 200ms ease;
        }
        .photo-circle:hover {
          border-color: var(--purple, #A943F5);
          background: #F3EBFF;
          transform: translateY(-2px);
        }
        .photo-circle img { width: 100%; height: 100%; object-fit: cover; }
        .photo-plus {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #77727F;
          text-align: center;
          line-height: 1.35;
          padding: 6px;
        }

        .identity-fields { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }

        .role-field { margin-top: 20px; }
        .role-other { margin-top: 12px; max-width: 420px; }

        /* ─── Country combobox ─── */
        .country-select { position: relative; }

        .country-input { cursor: text; }
        .country-input.invalid { border-color: var(--purple, #A943F5); }

        .country-list {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 40;
          margin: 0;
          padding: 6px;
          list-style: none;
          max-height: 232px;
          overflow-y: auto;
          background: var(--white, #FFFFFF);
          border: 2px solid var(--border, #09030F);
          border-radius: 14px;
          box-shadow: 4px 5px 0 rgba(9, 3, 15, 0.18);
        }

        .country-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--dark, #09030F);
          text-align: left;
          cursor: pointer;
          transition: background 140ms ease, color 140ms ease;
        }
        .country-option.highlight { background: #F4F3FA; }
        .country-option.selected { color: var(--purple, #A943F5); font-weight: 700; }

        .country-empty {
          padding: 10px;
          font-size: 0.78rem;
          color: #77727F;
        }

        .identity-row-secondary {
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        /* ─── Step 2 — curiosity: DOMAIN → SKILLS ─── */
        .curiosity-search { margin-top: 22px; }

        .search-field { position: relative; display: flex; align-items: center; }

        .search-icon {
          position: absolute;
          left: 12px;
          display: inline-flex;
          color: #77727F;
          pointer-events: none;
        }

        .search-input { padding-left: 36px; padding-right: 36px; }

        .search-clear {
          position: absolute;
          right: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #77727F;
          cursor: pointer;
          transition: color 150ms ease, background 150ms ease;
        }
        .search-clear:hover { color: var(--dark, #09030F); background: #F4F3FA; }

        .domain-sections {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .domain-head {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 6px 2px;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }
        .domain-head.static { cursor: default; }

        .domain-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--purple, #A943F5);
          flex-shrink: 0;
        }

        .domain-title {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: var(--dark, #09030F);
        }

        .domain-count {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--purple, #A943F5);
        }

        .domain-toggle {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid rgba(9, 3, 15, 0.22);
          color: var(--dark, #09030F);
          flex-shrink: 0;
          transition: border-color 180ms ease;
        }
        .domain-head:hover .domain-toggle { border-color: var(--dark, #09030F); }

        /* Collapsed by default; the row-height transition is the only motion. */
        .domain-skills {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          visibility: hidden;
          transition:
            grid-template-rows 240ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 200ms ease,
            visibility 0s linear 240ms;
        }
        .domain-section.open .domain-skills {
          grid-template-rows: 1fr;
          opacity: 1;
          visibility: visible;
          transition:
            grid-template-rows 240ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 200ms ease,
            visibility 0s;
        }

        .domain-skills-inner { overflow: hidden; min-height: 0; padding-top: 4px; }
        .domain-skill-row { display: flex; flex-wrap: wrap; gap: 7px; }

        .domain-skill {
          padding: 8px 14px;
          font-size: 0.875rem;
          border-color: var(--dark, #09030F);
        }
        .domain-skill:hover:not(:disabled) { transform: translateY(-1px); }

        .search-empty {
          margin: 18px 0 0;
          font-size: 0.8rem;
          line-height: 1.6;
          color: #77727F;
        }

        /* ─── Selected skills summary ─── */
        .selection-panel {
          margin-top: 24px;
          border: 2px solid var(--border, #09030F);
          border-radius: 18px;
          padding: 15px 16px;
          background: #FBFAFE;
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.12);
        }

        .selection-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .selection-title {
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          color: var(--dark, #09030F);
        }

        .selection-meta {
          font-size: 0.72rem;
          font-weight: 700;
          color: #77727F;
          font-variant-numeric: tabular-nums;
        }
        .selection-meta strong { color: var(--purple, #A943F5); }

        .selection-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 11px;
        }

        .selection-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px 6px 13px;
          border-radius: 999px;
          border: 2px solid var(--dark, #09030F);
          background: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          font-size: 0.78rem;
          font-weight: 600;
        }

        .selection-chip-x {
          display: inline-flex;
          align-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: color 150ms ease;
        }
        .selection-chip-x:hover { color: var(--purple-light, #C084FC); }

        .selection-empty {
          margin: 11px 0 0;
          font-size: 0.76rem;
          line-height: 1.55;
          color: #77727F;
        }

        .selection-recommend {
          margin: 11px 0 0;
          font-size: 0.68rem;
          color: #77727F;
        }

        .custom-input-row {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-width: 520px;
        }
        .custom-input-controls { display: flex; align-items: center; gap: 10px; }

        .step-footer-meta {
          margin-top: 22px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .counter { font-size: 0.82rem; font-weight: 700; color: var(--dark, #09030F); }
        .counter strong { color: var(--purple, #A943F5); }
        .counter-hint { font-size: 0.72rem; color: #77727F; }

        /* ─── Step 3 ─── */
        .skill-sections { display: flex; flex-direction: column; gap: 18px; }

        .skill-section {
          border: 2px solid rgba(9, 3, 15, 0.12);
          border-radius: 18px;
          padding: 16px 18px;
          background: #FBFAFE;
        }

        .skill-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .skill-section-heading { min-width: 0; }

        .skill-section-sub {
          margin: 4px 0 0;
          font-size: 0.75rem;
          line-height: 1.5;
          color: #77727F;
        }

        .skill-section-title {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          color: var(--dark, #09030F);
          margin: 0;
        }
        .skill-count {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--purple, #A943F5);
          font-variant-numeric: tabular-nums;
        }

        .skill-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 13px;
          background: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          border-radius: 999px;
          font-size: 0.79rem;
          font-weight: 600;
        }
        .skill-pill-x {
          display: inline-flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          transition: color 150ms ease;
        }
        .skill-pill-x:hover { color: var(--purple-light, #C084FC); }

        .skill-input-row { display: flex; gap: 10px; margin-top: 12px; align-items: center; }
        .ob-input-inline { flex: 1; padding: 10px 12px; font-size: 0.85rem; }

        .add-skill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--white, #FFFFFF);
          border: 2px solid var(--dark, #09030F);
          border-radius: 12px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 2px 2px 0 rgba(9, 3, 15, 0.18);
          transition: background 200ms ease, color 200ms ease, transform 200ms ease;
        }
        .add-skill-btn:hover:not(:disabled) {
          background: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          transform: translateY(-2px);
        }
        .add-skill-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

        .hint-row {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .hint-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #9A95A3;
        }
        .hint-chip {
          padding: 4px 11px;
          border-radius: 999px;
          border: 1.5px dashed rgba(9, 3, 15, 0.28);
          background: transparent;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.69rem;
          color: #77727F;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .hint-chip:hover {
          border-color: var(--purple, #A943F5);
          color: var(--purple, #A943F5);
          background: rgba(169, 67, 245, 0.06);
        }
        .hint-chip-quiet { border-style: dashed; }

        /* ─── Step 4 — focus domains ─── */
        .focus-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .focus-card {
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 46px;
          padding: 9px 12px;
          background: var(--white, #FFFFFF);
          border: 2px solid var(--dark, #09030F);
          border-radius: 12px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          line-height: 1.3;
          text-transform: uppercase;
          text-align: left;
          color: var(--dark, #09030F);
          cursor: pointer;
          transition:
            background 200ms cubic-bezier(0.16, 1, 0.3, 1),
            color 200ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 200ms ease,
            opacity 200ms ease;
        }
        .focus-card:hover:not(.capped) {
          transform: translateY(-1px);
          box-shadow: 2px 3px 0 rgba(9, 3, 15, 0.16);
        }
        .focus-card.selected {
          background: var(--dark, #09030F);
          border-color: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          box-shadow: 2px 3px 0 rgba(9, 3, 15, 0.25);
        }
        .focus-card.capped { opacity: 0.42; }
        .focus-card.selected .chip-check { width: 13px; }
        .focus-card-label { min-width: 0; }

        .focus-details {
          margin-top: 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .focus-detail-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .focus-detail-title {
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dark, #09030F);
        }

        .focus-detail-tag {
          margin-left: auto;
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #9A95A3;
        }

        .focus-detail-empty {
          margin-top: 26px;
          font-size: 0.8rem;
          line-height: 1.6;
          color: #77727F;
        }

        .goal-block { margin-top: 26px; }

        .ob-field-optional {
          margin-left: 6px;
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #9A95A3;
        }

        /* ─── Card footer nav ─── */
        .ob-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 28px;
          padding-top: 22px;
          border-top: 2px solid rgba(9, 3, 15, 0.1);
        }
        .ob-footer-spacer { width: 1px; }

        .ob-back-btn {
          padding: 11px 20px;
          background: var(--white, #FFFFFF);
          border: 2px solid var(--dark, #09030F);
          border-radius: 12px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 2px 2px 0 rgba(9, 3, 15, 0.2);
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease;
        }
        .ob-back-btn:hover {
          transform: translateY(-2px);
          box-shadow: 3px 4px 0 rgba(9, 3, 15, 0.24);
        }

        .ob-gate-reason {
          flex: 1;
          text-align: center;
          font-size: 0.72rem;
          color: #77727F;
        }

        .ob-primary-btn {
          padding: 12px 26px;
          background: var(--dark, #09030F);
          color: var(--white, #FFFFFF);
          border: 2px solid var(--dark, #09030F);
          border-radius: 12px;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.87rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.3);
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease,
            opacity 200ms ease;
        }
        .ob-primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 5px 5px 0 rgba(9, 3, 15, 0.3);
          background: #1A0D2E;
        }
        .ob-primary-btn:active:not(:disabled) { transform: scale(0.98); }
        .ob-primary-btn.disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

        /* ─── Completion ─── */
        .completion-body { display: flex; flex-direction: column; }
        .summary-block {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 2px solid rgba(9, 3, 15, 0.12);
          border-radius: 18px;
          padding: 18px 20px;
          background: #FBFAFE;
        }
        .completion-cta { margin-top: 26px; align-self: flex-start; }

        /* ─── Profile preview (inside card) ─── */
        .pp-card {
          border: 2px solid var(--border, #09030F);
          border-radius: 18px;
          background: var(--white, #FFFFFF);
          padding: 16px;
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.12);
        }

        .pp-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(9, 3, 15, 0.1);
        }

        .pp-eyebrow {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--dark, #09030F);
        }

        .pp-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--purple, #A943F5);
        }
        .pp-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--purple, #A943F5);
        }

        .pp-identity {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }
        .pp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--border, #09030F);
          background: #F2EFFA;
          overflow: hidden;
          flex-shrink: 0;
          display: inline-flex;
        }
        .pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pp-username {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          word-break: break-word;
        }

        .pp-name {
          margin-top: 6px;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #77727F;
          text-transform: uppercase;
        }
        .pp-role { color: var(--purple, #A943F5); }

        .pp-focus-list { display: flex; flex-direction: column; gap: 7px; }
        .pp-focus-name {
          display: block;
          font-size: 0.79rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          line-height: 1.35;
        }
        .pp-focus-skills {
          display: block;
          margin-top: 1px;
          font-size: 0.73rem;
          color: #77727F;
          line-height: 1.45;
        }

        .pp-body {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pp-row { display: flex; flex-direction: column; gap: 2px; }
        .pp-label {
          font-size: 0.56rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--purple, #A943F5);
        }
        .pp-value {
          font-size: 0.79rem;
          font-weight: 600;
          color: var(--dark, #09030F);
          line-height: 1.45;
        }
        .pp-quote { font-weight: 500; color: #4A4453; }

        .pp-placeholder {
          font-size: 0.76rem;
          line-height: 1.6;
          color: #77727F;
        }

        .sr-only-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        /* ═══════════════ RESPONSIVE ═══════════════ */
        @media (max-width: 1024px) {
          .ob-frame { border-radius: 32px; }
          .ob-card { max-width: 100%; border-radius: 26px; }
          .ob-card-grid {
            grid-template-columns: minmax(0, 1.6fr) minmax(210px, 1fr);
            gap: 22px;
          }
          .ob-hero-heading { font-size: clamp(2.4rem, 6vw, 3.4rem); }
        }

        @media (max-width: 900px) {
          .eco-layer { display: none; }
          .ob-card-grid { grid-template-columns: 1fr; }
          .ob-preview-col { order: 2; }
        }

        @media (max-width: 768px) {
          .ob-page { padding: 12px; }
          .ob-frame {
            min-height: calc(100vh - 24px);
            border-radius: 24px;
            padding: 14px 14px 26px;
          }
          .ob-hero { padding: 18px 6px 16px; gap: 10px; }
          .ob-hero-heading { font-size: clamp(2.2rem, 9vw, 3rem); }

          .ob-steps { display: none; }

          .ob-steps-compact {
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            z-index: 6;
            padding: 0 6px 18px;
          }

          .ob-compact-head {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 10px;
          }
          .ob-compact-count {
            font-family: var(--font-heading, 'Anton', sans-serif);
            font-size: 1rem;
            letter-spacing: 0.06em;
            color: var(--white, #FFFFFF);
          }
          .ob-compact-label {
            font-size: 0.66rem;
            font-weight: 700;
            letter-spacing: 0.14em;
            color: rgba(255, 255, 255, 0.92);
          }
          .count-narrow { display: none; }

          .ob-compact-track {
            height: 6px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.28);
            border: 1.5px solid rgba(9, 3, 15, 0.35);
            overflow: hidden;
            display: block;
          }
          .ob-compact-fill {
            display: block;
            height: 100%;
            background: var(--dark, #09030F);
            border-radius: 999px;
          }

          .ob-card {
            border-width: 2.5px;
            border-radius: 22px;
            padding: 20px 18px;
            box-shadow: 3px 4px 0 var(--border, #09030F);
          }

          .identity-row { flex-direction: column; gap: 16px; }
          .identity-row-secondary { grid-template-columns: 1fr; }

          .domain-title { font-size: 0.8rem; letter-spacing: 0.08em; }
          .focus-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .domain-skill { padding: 7px 12px; font-size: 0.82rem; }

          .skill-input-row,
          .custom-input-controls { flex-direction: column; align-items: stretch; }
          .add-skill-btn { width: 100%; }
          .country-list { max-height: 200px; }
          .custom-input-row { max-width: 100%; }

          .ob-footer {
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
            padding-top: 18px;
          }
          .ob-footer-spacer { display: none; }
          .ob-back-btn { flex: 1; }
          .ob-primary-btn { flex: 1; }
          .ob-gate-reason { order: 3; flex: 1 0 100%; text-align: left; }
          .completion-cta { align-self: stretch; width: 100%; }
        }

        @media (max-width: 430px) {
          .ob-frame { border-radius: 20px; padding: 12px 12px 22px; }
          .ob-card { padding: 18px 14px; }
          .ob-chip { padding: 7px 12px; font-size: 0.78rem; }
          .ob-chip-lg { padding: 9px 14px; font-size: 0.8rem; }
          .ob-chip-sm { padding: 5px 10px; font-size: 0.72rem; }
          .focus-grid { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); }
          .focus-card { min-height: 42px; padding: 8px 10px; font-size: 0.71rem; }
          .photo-circle { width: 80px; height: 80px; }
          .ob-steps { gap: 8px; }
        }

        @media (max-width: 390px) {
          .count-wide { display: none; }
          .count-narrow { display: inline; }
          .ob-frame { padding: 10px 10px 20px; }
          .ob-hero { padding: 14px 4px 12px; }
          .ob-hero-sub { font-size: 0.85rem; }
          .ob-card { padding: 16px 12px; }
          .step-heading { font-size: 1.45rem; }
          .ob-chip { padding: 6px 11px; font-size: 0.75rem; }
          .skill-section { padding: 13px 13px; }
          .ob-primary-btn,
          .ob-back-btn { padding: 11px 14px; font-size: 0.82rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ob-frame * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </main>
  );
}

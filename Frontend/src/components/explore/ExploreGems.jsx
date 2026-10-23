import React, { useEffect, useState, useCallback, useRef } from 'react';
import HeroHeader from '../HeroHeader';
import { fetchRecommendedCreators, connectToCreator } from '../../services/creatorService';
import './ExploreGems.css';
import { profileService } from "../../services/profileService";// ─── Draft key — same key the onboarding flow uses ──────────────────────────
const DRAFT_KEY = 'evolve-onboarding-draft';
import { authService } from "../../services/authService";
/** Load the saved onboarding profile from localStorage. */
function loadProfile() {
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
          role: text(saved.role),
          curiosities: list(saved.curiosities),
          skills: {
            canDo: list(saved.skills?.canDo),
            learning: list(saved.skills?.learning),
            wantToImprove: list(saved.skills?.wantToImprove),
          },
          focusDomains: list(saved.focusDomains),
        };
      }
    }
  } catch {
    /* corrupted — return defaults */
  }
  return null;
}

/** Derive a clean interest list from the profile (curiosities + focus domains). */
function deriveInterests(profile) {
  if (!profile) return [];
  const raw = [...(profile.curiosities || []), ...(profile.focusDomains || [])];
  // Deduplicate while preserving order
  const seen = new Set();
  return raw.filter((item) => {
    const key = item.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Profile Appearance Modal ──────────────────────────────────────────────────
function ProfileAppearanceModal({ onClose }) {
  const [visible, setVisible] = useState(true);
  const [profile, setProfile] = useState(null);
  const [interests, setInterests] = useState([]);          // NEW (replaces deriveInterests)
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
   const t = localStorage.getItem("evolv_auth_token") || sessionStorage.getItem("evolv_auth_token");
   const { exp } = JSON.parse(atob(t.split(".")[1]));
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const [profileRes, curiosityRes] = await Promise.allSettled([
          profileService.getProfile(),
          profileService.getUserCuriosity(),
        ]);

        if (cancelled) return;

        if (profileRes.status !== "fulfilled") throw profileRes.reason;

        const data = profileRes.value?.data ?? profileRes.value;
        const userProfile = data?.profile ?? data;

        // role comes from identities[] (primary one)
        const identities = data?.identities ?? [];
        const primary = identities.find((i) => i.isPrimary) ?? identities[0];

        // map backend fields -> the field names your JSX already uses
        setProfile({
          ...userProfile,
          profilePhoto: userProfile?.avatarUrl,
          role: primary?.identityType?.name ?? "",
        });

        const isVisible = data?.visible ?? data?.isVisible ?? data?.showProfile;
        if (typeof isVisible === "boolean") setVisible(isVisible);

        // interests come from the curiosity endpoint
        if (curiosityRes.status === "fulfilled") {
          const payload = curiosityRes.value;
          const list = Array.isArray(payload)
            ? payload
            : payload?.data ?? payload?.skills ?? payload?.curiosities ?? [];

          const idToName = await profileService
            .fetchSkillIdToNameMap()
            .catch(() => ({}));

          const names = list
            .map((item) =>
              typeof item === "string"
                ? item
                : typeof item === "number"
                  ? idToName[item]
                  : item?.skill?.name ??
                  item?.name ??
                  idToName[item?.skillId] ??
                  idToName[item?.id]
            )
            .filter(Boolean);

          if (!cancelled) setInterests(names);
        } else {
          console.warn("Failed to load interests:", curiosityRes.reason);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load profile:", error);
          setProfileError(error.message || "Unable to load profile.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

const authUser = authService.getCurrentUser();
const displayName = profile?.name || authUser?.name || profile?.username || "Your Name";

  return (
    <div className="eg-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pa-title">
      <div className="eg-modal-card">
        <button className="eg-modal-close" aria-label="Close" onClick={onClose}>×</button>
        {profileLoading && (
          <p className="eg-modal-sub">Loading your profile...</p>
        )}

        {profileError && (
          <p role="alert" className="eg-modal-empty">
            {profileError}
          </p>
        )}
        <h2 id="pa-title" className="eg-modal-title">Profile Appearance</h2>
        <p className="eg-modal-sub">Control how other EVOLV members see you.</p>

        <div className="eg-modal-avatar-row">
          {profile?.profilePhoto ? (
            <img
              src={profile.profilePhoto}
              alt={profile.name || 'You'}
              className="eg-modal-avatar"
            />
          ) : (
            <div className="eg-modal-avatar-placeholder">
              {(profile?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="eg-modal-avatar-info">
            <strong>{displayName}</strong>
            <span>@{profile?.username || 'username'}</span>
          </div>
        </div>

        <div className="eg-modal-section">
          <span className="eg-modal-label">PRIMARY ROLE</span>
          <span className="eg-modal-value">{profile?.role || '—'}</span>
        </div>

        <div className="eg-modal-section">
          <span className="eg-modal-label">INTERESTS</span>
          <div className="eg-modal-pills">
            {interests.length > 0
              ? interests.map((i) => <span key={i} className="eg-interest-pill">{i}</span>)
              : <span className="eg-modal-empty">No interests selected yet.</span>
            }
          </div>
        </div>

        <div className="eg-modal-section eg-modal-toggle-row">
          <span className="eg-modal-label">SHOW MY PROFILE</span>
          <label className="eg-toggle">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              aria-label="Show my profile to other users"
            />
            <span className="eg-toggle-track">
              <span className="eg-toggle-thumb" />
            </span>
          </label>
        </div>

        <div className="eg-modal-actions">
          <button className="eg-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="eg-btn-primary" onClick={onClose}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="eg-creator-card eg-skeleton" aria-hidden="true">
      <div className="eg-skeleton-avatar" />
      <div className="eg-skeleton-line eg-skeleton-name" />
      <div className="eg-skeleton-line eg-skeleton-domain" />
      <div className="eg-skeleton-btn" />
    </div>
  );
}

// ─── Creator Card ──────────────────────────────────────────────────────────────
function CreatorCard({ creator, isConnected, onConnect, connectingId }) {
  const isConnecting = connectingId === creator.id;

  return (
    <div className="eg-creator-card">
      <div className="eg-creator-avatar-wrap">
        <img
          src={creator.profileImage}
          alt={creator.displayName}
          className="eg-creator-avatar"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
        <div className="eg-creator-avatar-fallback" style={{ display: 'none' }}>
          {creator.displayName.charAt(0).toUpperCase()}
        </div>
      </div>

      <p className="eg-creator-username">@{creator.username}</p>
      <p className="eg-creator-domain">{creator.domain}</p>

      <button
        className={`eg-connect-btn ${isConnected ? 'connected' : ''} ${isConnecting ? 'loading' : ''}`}
        onClick={() => onConnect(creator.id)}
        disabled={isConnected || isConnecting}
        aria-label={
          isConnected
            ? `Connected with ${creator.displayName}`
            : `Connect with ${creator.displayName}`
        }
      >
        {isConnecting ? (
          <span className="eg-btn-spinner" />
        ) : isConnected ? (
          <>Connected <span className="eg-check">✓</span></>
        ) : (
          <>Connect <span className="eg-arrow">→</span></>
        )}
      </button>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="eg-empty-state">
      <div className="eg-empty-icon">💎</div>
      <h3 className="eg-empty-title">No gems found yet.</h3>
      <p className="eg-empty-sub">Try adding more interests to discover more people.</p>
      <a
        href="/#/onboarding"
        className="eg-btn-primary eg-empty-cta"
        onClick={(e) => {
          e.preventDefault();
          window.location.hash = '/onboarding';
          window.dispatchEvent(new Event('navigated'));
        }}
      >
        Update Interests →
      </a>
    </div>
  );
}

// ─── How many cards are visible per breakpoint ────────────────────────────────
// These must stay in sync with the CSS --eg-cards-per-view custom property.
const CARDS_DESKTOP = 5;
const CARDS_TABLET = 3;  // ≤ 900px
const CARDS_MOBILE = 1;  // ≤ 540px

/** Read the current cards-per-view from a CSS custom property set on the
 *  slider viewport — this keeps JS and CSS breakpoints in one place. */
function getCardsPerView(viewportEl) {
  if (!viewportEl) return CARDS_DESKTOP;
  const val = parseInt(
    getComputedStyle(viewportEl).getPropertyValue('--eg-cards-per-view').trim(),
    10
  );
  return isNaN(val) ? CARDS_DESKTOP : val;
}

// ─── Horizontal Creator Slider ─────────────────────────────────────────────────
function CreatorSlider({ creators, connectedIds, onConnect, connectingId }) {
  const [startIndex, setStartIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const viewportRef = useRef(null);

  // Derive cards-per-view reactively on resize
  const [cardsPerView, setCardsPerView] = useState(CARDS_DESKTOP);
  useEffect(() => {
    const update = () => setCardsPerView(getCardsPerView(viewportRef.current));
    update();
    const ro = new ResizeObserver(update);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  const totalCreators = creators.length;
  const maxStart = Math.max(0, totalCreators - cardsPerView);
  const atStart = startIndex === 0;
  const atEnd = startIndex >= maxStart;

  const slide = useCallback((direction) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setStartIndex((prev) => {
      if (direction === 'next') return Math.min(prev + cardsPerView, maxStart);
      return Math.max(prev - cardsPerView, 0);
    });
    setTimeout(() => setIsAnimating(false), 420);
  }, [isAnimating, cardsPerView, maxStart]);

  // The translateX offset: each card occupies (100% / cardsPerView) of the track
  const translateX = -(startIndex * (100 / cardsPerView));

  return (
    <div className="eg-slider-shell">
      {/* ← Previous */}
      <button
        className={`eg-slider-nav eg-slider-prev ${atStart ? 'disabled' : ''}`}
        onClick={() => slide('prev')}
        disabled={atStart}
        aria-label="Previous creators"
      >
        ←
      </button>

      {/* Clipping viewport */}
      <div className="eg-slider-viewport" ref={viewportRef}>
        {/* Sliding track — all cards live here */}
        <div
          className="eg-slider-track"
          style={{
            transform: `translateX(${translateX}%)`,
            transition: isAnimating ? 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        >
          {creators.map((creator, index) => (
            <div
              key={creator.id}
              className="eg-slider-item"
              style={{ '--eg-cards-per-view-item': cardsPerView }}
            >
              <CreatorCard
                creator={creator}
                isConnected={connectedIds.has(creator.id)}
                onConnect={onConnect}
                connectingId={connectingId}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Next → */}
      <button
        className={`eg-slider-nav eg-slider-next ${atEnd ? 'disabled' : ''}`}
        onClick={() => slide('next')}
        disabled={atEnd}
        aria-label="Next creators"
      >
        →
      </button>
    </div>
  );
}

// ─── Main ExploreGems Page ─────────────────────────────────────────────────────
export default function ExploreGems() {
  const [profile] = useState(loadProfile);
  const [interests] = useState(() => deriveInterests(loadProfile()));
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [connectingId, setConnectingId] = useState(null);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  const handleSkip = useCallback(() => {
    // Navigate to Home using your existing hash-based routing.
    window.location.hash = '/home';
    window.dispatchEvent(new Event('navigated'));
  }, []);

  // Fetch creators on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchRecommendedCreators(interests, 10).then((data) => {
      if (!cancelled) {
        setCreators(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [interests]); // interests is stable (derived once from localStorage)

  const handleConnect = useCallback(async (creatorId) => {
    if (connectedIds.has(creatorId) || connectingId) return;

    setConnectingId(creatorId);
    try {
      await connectToCreator(creatorId);
      setConnectedIds((prev) => new Set([...prev, creatorId]));
    } catch {
      // Silently fail — a toast/error system can be wired here later
    } finally {
      setConnectingId(null);
    }
  }, [connectedIds, connectingId]);

  const SKELETON_COUNT = 5;

  return (
    <main className="eg-page" role="main">
      <section className="eg-frame" aria-label="Explore The Gems">

        {/* Reuse existing EVOLV navbar */}
        <HeroHeader />

        {/* ─── Hero section ─────────────────────────────────────────────── */}
        <div className="eg-hero">
          <div className="eg-hero-left">
            <span className="eg-eyebrow">DISCOVER PEOPLE</span>
            <h1 className="eg-hero-heading">
              EXPLORE THE GEMS
            </h1>
            <p className="eg-hero-sub">
              Discover people who share your interests, skills, and passion.
            </p>
          </div>

          <div className="eg-hero-right">
            <button
              type="button"
              className="eg-skip-btn"
              onClick={handleSkip}
            >
              Skip for now <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              className="eg-profile-appearance-btn"
              onClick={() => setShowAppearanceModal(true)}
              aria-label="Open profile appearance settings"
            >
              Profile Appearance <span className="eg-btn-arrow">→</span>
            </button>
          </div>
        </div>

        {/* ─── Interests strip ──────────────────────────────────────────── */}
        {interests.length > 0 && (
          <div className="eg-interests-strip">
            <span className="eg-interests-label">Based on your interests</span>
            <div className="eg-interests-pills" role="list" aria-label="Your selected interests">
              {interests.map((interest) => (
                <span key={interest} className="eg-interest-pill" role="listitem">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── White content card ────────────────────────────────────────── */}
        <div className="eg-content-card">

          {/* Section heading */}
          <div className="eg-section-header">
            <h2 className="eg-section-title">People You Might Connect With</h2>
            <p className="eg-section-sub">
              Creators selected based on your interests and skills.
            </p>
          </div>

          {/* Creator slider */}
          {loading ? (
            <div className="eg-slider-skeleton" aria-busy="true" aria-label="Loading creators">
              {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <EmptyState />
          ) : (
            <CreatorSlider
              creators={creators}
              connectedIds={connectedIds}
              onConnect={handleConnect}
              connectingId={connectingId}
            />
          )}
        </div>
      </section>

      {/* Profile Appearance Modal */}
      {showAppearanceModal && (
        <ProfileAppearanceModal
          profile={profile}
          onClose={() => setShowAppearanceModal(false)}
        />
      )}
    </main>
  );
}

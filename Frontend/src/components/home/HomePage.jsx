import React, { useState, useCallback, useRef, useEffect } from 'react';
import CommentPanel from '../shared/CommentPanel.jsx';
import {
  Home,
  Compass,
  PlaySquare,
  Users,
  Bell,
  User,
  Bookmark,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  MoreHorizontal,
  Play,
  ChevronLeft,
  LogOut,
  CheckCheck,
  X,
  Clapperboard,
  BookOpen,
  Check,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Menu,
  LayoutDashboard,
  Tag
} from 'lucide-react';
import { CURIOSITY_DOMAINS } from '../onboarding/onboardingData.js';

import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import { connectionService } from '../../services/connectionService.js';
import { fetchHomeTabs, mapTabsToLabels } from '../../services/homeTabService.js';
import { profileService } from '../../services/profileService.js';
import { getProfile } from '../../services/getProfile.js';
import socketService from '../../services/socketService.js';
import { CREATORS, INTEREST_TABS } from '../../data/homeData.js';
import { useUnreadCounts } from '../../components/hooks/useNotificationCount.jsx';
import { userSearchService } from '../../services/userSearchService.js';
import { useConnectionRequestCount } from '../../components/hooks/useConnectionRequestCount.jsx';
import './HomePage.css';

// ─── Navigation helper (matches App.jsx's custom routing) ───────────────────
function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('navigated'));
}
function openUserProfile(userId) {
  if (userId == null) return;
  window.location.hash = `/profile/${userId}`;
  window.dispatchEvent(new Event('navigated'));
}

// ─── Avatar component with fallback ────────────────────────────────────────
function Avatar({ src, name, size = 40, className = '' }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return err || !src ? (
    <div
      className={`hp-avatar-fallback ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {initials}
    </div>
  ) : (
    <img
      src={src}
      alt={name}
      className={`hp-avatar-img ${className}`}
      style={{ width: size, height: size }}
      onError={() => setErr(true)}
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// LEFT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: 'home', label: 'Home', icon: Home, href: '#/home' },
  { id: 'discover', label: 'Discover', icon: Compass, href: '#/discover' },
  { id: 'mylearning', label: 'My Learning', icon: BookOpen, href: '#/learning' },
  { id: 'bookmark', label: 'Bookmark', icon: Bookmark, href: '#/saved' },
];

const COMMUNITY_NAV = [
  { id: 'messages', label: 'Messages', icon: MessageCircle, href: '#/messages' },
];

const DEV_LEARNING_GOALS = [];
function HomeSidebar({ user, activeNav = 'home', isSidebarOpen, setIsSidebarOpen }) {
  // ── Real user skills from GET /api/skills/user-skills ─────────────────
  const [sidebarSkills, setSidebarSkills] = useState([]);
  const [sidebarGoals, setSidebarGoals] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // ── Real profile avatar from GET /api/profile ──────────────────────────
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(null);
  const [profileUsername, setProfileUsername] = useState(null);
  const [profileDisplayName, setProfileDisplayName] = useState(null);
  const requestCount = useConnectionRequestCount();

  useEffect(() => {
    let cancelled = false;

    const getRecords = (response) => {
      const value = response?.data ?? response;

      if (Array.isArray(value)) return value;
      if (Array.isArray(value?.data)) return value.data;
      if (Array.isArray(value?.skills)) return value.skills;
      if (Array.isArray(value?.items)) return value.items;
      if (Array.isArray(value?.userSkills)) return value.userSkills;

      return [];
    };

    const loadSelectedSkills = async () => {
      setSkillsLoading(true);

      try {
        // Fetch saved user skills and available skill names together.
        const [userSkillsResult, categoryResults, curiosityResult] =
          await Promise.all([
            profileService.getUserSkills(),
            Promise.allSettled(
              Array.from({ length: 20 }, (_, index) =>
                profileService.getCategorySkills(index + 1)
              )
            ),
            profileService.getUserCuriosity(),
          ]);

        if (cancelled) return;

        // Map backend skill IDs to their actual names.
        const skillNameById = new Map();

        categoryResults.forEach((result) => {
          if (result.status !== "fulfilled") return;

          const categoryData = result.value?.data ?? result.value;

          const skills = getRecords(categoryData);

          skills.forEach((skill) => {
            if (skill?.id != null && skill?.name) {
              skillNameById.set(Number(skill.id), skill.name);
            }
          });
        });

        // Extract IDs from the user-skills API response.
        const getSkillIds = (record) => {
          if (record?.skillId != null) {
            return [record.skillId];
          }

          const values = record?.skills ?? record?.skill;

          if (Array.isArray(values)) {
            return values.map((item) =>
              typeof item === "object"
                ? item.id ?? item.skillId
                : item
            ).filter((id) => id != null);
          }

          if (values != null) {
            return [
              typeof values === "object"
                ? values.id ?? values.skillId
                : values,
            ].filter((id) => id != null);
          }

          return [];
        };

        const getNames = (record) =>
          getSkillIds(record)
            .map((id) => skillNameById.get(Number(id)))
            .filter(Boolean);

        const records = getRecords(userSkillsResult);
        const allSelectedSkills = [];
        const learningGoals = [];

        records.forEach((record) => {
          const names = getNames(record);

          // Show every selected skill in MY SKILLS.
          allSelectedSkills.push(...names);

          // Keep learning-related skills in MY LEARNING GOALS too.
          if (
            record.relationshipType === "LEARNING" ||
            record.relationshipType === "WANT_TO_IMPROVE"
          ) {
            learningGoals.push(...names);
          }
        });

        // Also include the user's curiosity selections.
        getRecords(curiosityResult).forEach((record) => {
          allSelectedSkills.push(...getNames(record));
        });

        const unique = (items) => [
          ...new Map(
            items
              .filter(
                (name) => typeof name === "string" && name.trim()
              )
              .map((name) => [name.trim().toLowerCase(), name.trim()])
          ).values(),
        ];

        setSidebarSkills(unique(allSelectedSkills));
        setSidebarGoals(unique(learningGoals));
      } catch (error) {
        console.error("[HomeSidebar] Failed to load skills:", error);

        if (!cancelled) {
          setSidebarSkills([]);
          setSidebarGoals([]);
        }
      } finally {
        if (!cancelled) {
          setSkillsLoading(false);
        }
      }
    };

    loadSelectedSkills();

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    getProfile.getProfile()
      .then((p) => {
        if (cancelled) return;
        if (p?.avatarUrl || p?.avatar) setProfileAvatarUrl(p.avatarUrl || p.avatar);
        if (p?.username) setProfileUsername(p.username);
        if (p?.fullName || p?.name) setProfileDisplayName(p.fullName || p.name);
      })
      .catch(() => { /* silently fall back to authService data */ });
    return () => { cancelled = true; };
  }, []);

  // Display real data when loaded, fall back to dev placeholders while loading
  const displaySkills = Array.isArray(sidebarSkills)
    ? sidebarSkills
    : [];
  const displayGoals = Array.isArray(sidebarGoals)
    ? sidebarGoals
    : [];  // Scroll-lock: prevent background scroll when drawer is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const handleNavClick = (item) => {
    if (item.href.startsWith('#/')) {
      window.location.hash = item.href.slice(1);
      window.dispatchEvent(new Event('navigated'));
    } else {
      navigate(item.href);
    }
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <>

      <style>{`

/* Keep the action tooltip above the post card */
.hp-post {
  overflow: visible !important;
}

.hp-post-actions {
  position: relative;
  overflow: visible !important;
  z-index: 5;
}

.hp-post-actions-left {
  overflow: visible !important;
}

.hp-action-btn {
  position: relative;
}

.hp-action-btn .hp-action-tooltip:not(:empty) {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 12px);
  transform: translateX(-50%);
  z-index: 9999 !important;
  display: block !important;
}

/* Keep the tooltip above nearby media and cards */
.hp-post-actions-left .hp-action-btn {
  isolation: auto;
}

  .hp-post-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 0 4px;
    border-top: 1px solid rgba(9, 3, 15, 0.06);
    box-sizing: border-box;
    gap: 8px;
  }

  .hp-post-actions-left {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
  }

  .hp-action-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 4px 0;
    border: none;
    background: transparent;
    color: #27213a;
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.2s ease, transform 0.15s ease;
  }

  .hp-action-btn svg {
    flex-shrink: 0;
  }

  .hp-action-btn:hover {
    transform: translateY(-1px);
  }

  .hp-appreciate-btn:hover,
  .hp-appreciate-btn.active {
    color: #ef476f;
  }

  .hp-helpful-btn:hover,
  .hp-helpful-btn.active {
    color: #5b5cf0;
  }

  .hp-learned-btn:hover,
  .hp-learned-btn.active {
    color: #16a05d;
  }

  .hp-discuss-btn:hover {
    color: #263b62;
  }

  .hp-save-btn,
  .hp-post-more-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: #17213a;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.2s ease, transform 0.15s ease;
  }

  .hp-save-btn:hover,
  .hp-post-more-btn:hover {
    color: #aa45f5;
    transform: translateY(-1px);
  }

  .hp-save-btn.saved {
    color: #aa45f5;
  }

  .hp-post-more-btn {
    margin-left: 10px;
  }

  .hp-post-actions > .hp-save-btn {
    margin-left: auto;
  }

  /* Action tooltip */
  .hp-action-tooltip {
    display: none !important;
  }

  .hp-action-btn .hp-action-tooltip:not(:empty) {
    display: block !important;
    position: absolute;
    left: 50%;
    bottom: calc(100% + 10px);
    transform: translateX(-50%);
    z-index: 100;
    width: max-content;
    max-width: 150px;
    padding: 7px 11px;
    border-radius: 8px;
    background: #1a0a2e;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }

  @media (hover: hover) and (pointer: fine) {
    .hp-action-btn:hover .hp-action-tooltip:not(:empty) {
      display: block !important;
    }
  }

  
/* Mobile + iPad responsive action buttons */
@media (max-width: 1024px) {
  .hp-post-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .hp-post-actions-left {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .hp-post-actions-left .hp-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 1 auto;
    gap: 0;
    min-width: 0;
    padding: 8px 0;
    white-space: nowrap;
  }
  /* Counts: always visible */
  .hp-post-actions-left .hp-action-btn > .hp-action-count {
    display: inline-block !important;
    margin-left: 4px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
  }

  /* Keep icons visible */
  .hp-post-actions-left .hp-action-btn > svg {
    display: block;
    width: 23px;
    height: 23px;
    flex-shrink: 0;
  }

  /* Preserve long-press tooltip */
  .hp-post-actions-left .hp-action-btn > .hp-action-tooltip:not(:empty) {
    display: block !important;
  }

  .hp-post-actions > .hp-save-btn {
    margin-left: 0;
    flex-shrink: 0;
  }

  .hp-post-actions > .hp-post-more-btn {
    margin-left: 0;
    padding: 6px 2px;
    flex-shrink: 0;
  }
}

  

  .hp-sidebar-section {
    padding: 0 16px 4px;
  }

  .hp-sidebar-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .hp-sidebar-edit-btn {
    font-size: 11px;
    color: #aa45f5;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-weight: 500;
  }

  .hp-sidebar-edit-btn:hover {
    text-decoration: underline;
  }

  .hp-skill-list {
    list-style: none;
    padding: 0;
    margin: 0 0 4px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .hp-skill-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #2d1b4e;
    padding: 2px 0;
  }

  .hp-skill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #aa45f5;
    flex-shrink: 0;
  }

  .hp-goal-icon {
    color: #aa45f5;
    flex-shrink: 0;
  }

  .hp-motivational-card {
    margin: 8px 12px 12px;
    padding: 14px;
    background: #1a0a2e;
    border-radius: 12px;
  }

  .hp-motivational-quote {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 5px;
    color: #fff;
    line-height: 1.4;
  }

  .hp-motivational-sub {
    font-size: 12px;
    margin: 0;
    color: rgba(255,255,255,0.65);
    line-height: 1.4;
  }
`}</style>

      {/* Backdrop — covers viewport behind the drawer */}
      <div
        className={`hp-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`hp-sidebar ${isSidebarOpen ? 'open' : ''}`}
        aria-label="Main navigation"
        aria-modal={isSidebarOpen}
      >
        {/* Logo — button instead of <a> so it never navigates and never intercepts the X click */}
        <div className="hp-sidebar-logo">
          <button
            type="button"
            className="hp-logo-btn"
            aria-label="Go to EVOLV home"
            onClick={() => { window.location.hash = '/home'; window.dispatchEvent(new Event('navigated')); setIsSidebarOpen(false); }}
          >
            <img src="/logo.png" alt="EVOLV" className="hp-logo-img" />
          </button>
          <button
            type="button"
            className="hp-sidebar-close"
            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Nav */}
        <nav aria-label="Main navigation">
          <p className="hp-nav-section-label">MAIN NAV</p>
          <ul className="hp-nav-list">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeNav;
              return (
                <li key={item.id}>
                  <button
                    className={`hp-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Community */}
        <nav aria-label="Community navigation">
          <p className="hp-nav-section-label">COMMUNITY</p>
          <ul className="hp-nav-list">
            {COMMUNITY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    className="hp-nav-item"
                    onClick={() => handleNavClick(item)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* My Learning Goals */}
        <div className="hp-sidebar-section">
          <div className="hp-sidebar-section-header">
            <p className="hp-nav-section-label" style={{ margin: 0 }}>MY LEARNING GOALS</p>
            <button className="hp-sidebar-edit-btn" aria-label="Edit learning goals">Edit</button>
          </div>
          <ul className="hp-skill-list">
            {displayGoals.map((goal) => (
              <li key={goal} className="hp-skill-item">
                <Target size={12} className="hp-goal-icon" aria-hidden="true" />
                {goal}
              </li>
            ))}
          </ul>
        </div>

        {/* Spacer */}
        <div className="hp-sidebar-spacer" />

        {/* Motivational card */}
        <div className="hp-motivational-card" aria-label="Daily motivation">
          <p className="hp-motivational-quote">Consistency over consumption.</p>
          <p className="hp-motivational-sub">You're here to grow, not just scroll.</p>
        </div>

        {/* Create button */}
        <div className="hp-sidebar-footer">

          {/* User + logout */}
          {user && (
            <div className="hp-sidebar-user">
              {/* Avatar is clickable — navigates to profile page */}
              <button
                type="button"
                className="hp-sidebar-avatar-btn"
                onClick={() => { window.location.hash = '/profile'; window.dispatchEvent(new Event('navigated')); setIsSidebarOpen(false); }}
                aria-label="View my profile"
                title="View my profile"
              >
                <Avatar
                  src={profileAvatarUrl || user.avatar}
                  name={profileDisplayName || user.name}
                  size={36}
                />
              </button>
              <div className="hp-sidebar-user-info">
                <span className="hp-sidebar-user-name">{profileDisplayName || user.name || 'You'}</span>
                <span className="hp-sidebar-user-handle">
                  @{profileUsername || user.username || (user.email || '').split('@')[0]}
                </span>
              </div>
              <button
                className="hp-logout-btn"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER (top of feed)
// ─────────────────────────────────────────────────────────────────────────────
function HomeHeader({ user, profileAvatar, profileName, onOpenSidebar, onOpenRightSidebar }) {
  const { bell: pendingCount, messages: messageCount } = useUnreadCounts();

  return (
    <header className="hp-feed-header" style={{ marginTop: "10px" }}>
      {/* ── Hamburger: visible only on mobile ── */}
      <button
        type="button"
        className="hp-mobile-menu-btn"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="hp-feed-header-right" style={{ display: "flex", justifyContent: "end", alignItems: "center", gap: "8px" }}>
        {/* Search: mobile only */}
        <button
          type="button"
          className="hp-icon-btn hp-mobile-search-btn"
          aria-label="Search people"
          onClick={() => {
            window.location.hash = '/search';
            window.dispatchEvent(new Event('navigated'));
          }}
        >
          <Search size={20} aria-hidden="true" />
        </button>
        {/* Messages */}
        <button
          className="hp-icon-btn"
          aria-label={`Messages${messageCount ? ` (${messageCount} new)` : ''}`}
          onClick={() => {
            window.location.hash = '/messages';
            window.dispatchEvent(new Event('navigated'));
          }}
          style={{ marginRight: "10px" }}
        >
          <MessageCircle size={20} aria-hidden="true" />
          {messageCount > 0 && (
            <span className="hp-notif-badge" aria-hidden="true">
              {messageCount > 9 ? '9+' : messageCount}
            </span>
          )}
        </button>
        {/* Notification bell */}
        <button
          className="hp-icon-btn"
          aria-label={`Notifications${pendingCount ? ` (${pendingCount} new)` : ''}`}
          onClick={() => {
            window.location.hash = '/notifications';
            window.dispatchEvent(new Event('navigated'));
          }}
        >
          <Bell size={20} aria-hidden="true" />
          {pendingCount > 0 && (
            <span className="hp-notif-badge" aria-hidden="true">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>

        &nbsp;

        {/* Right-sidebar toggle: only on mobile */}
        <button
          type="button"
          className="hp-mobile-filter-btn"
          onClick={onOpenRightSidebar}
          aria-label="Open learning dashboard"
        >
          <LayoutDashboard size={20} aria-hidden="true" />
        </button>

        {/* Profile avatar — navigates to #/profile on click */}
        <button
          type="button"
          className="hp-mobile-user-btn"
          onClick={() => {
            window.location.hash = '/profile';
            window.dispatchEvent(new Event('navigated'));
          }}
          aria-label="Open my profile"
          title="View profile"
        >
          <Avatar
            src={profileAvatar || user?.avatar}
            name={profileName || user?.name || 'User'}
            size={34}
          />
        </button>

      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEREST TABS
// ─────────────────────────────────────────────────────────────────────────────
function InterestTabs({ active, onChange, tabs = INTEREST_TABS }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className="hp-tabs-wrapper" role="navigation" aria-label="Interest filter tabs">
      <button
        className="hp-tabs-arrow left"
        onClick={() => scroll(-1)}
        aria-label="Scroll tabs left"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <div className="hp-tabs-scroll" ref={scrollRef} role="list">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="listitem"
            className={`hp-tab ${active === tab ? 'active' : ''}`}
            onClick={() => onChange(tab)}
            aria-pressed={active === tab}
          >
            {tab}
          </button>
        ))}
      </div>
      <button
        className="hp-tabs-arrow right"
        onClick={() => scroll(1)}
        aria-label="Scroll tabs right"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function openReel(postId) {
  sessionStorage.setItem('evolv-reel-start', String(postId));
  sessionStorage.setItem('evolv-reel-back', window.location.hash.replace(/^#/, '') || '/home');
  window.location.hash = '/reels';
  window.dispatchEvent(new Event('navigated'));
}

function openImage(postId) {
  sessionStorage.setItem('evolv-image-start', String(postId));
  sessionStorage.setItem('evolv-image-back', window.location.hash.replace(/^#/, '') || '/home');
  window.location.hash = '/image';
  window.dispatchEvent(new Event('navigated'));
}

function openDocument(postId) {
  sessionStorage.setItem('evolv-doc-start', String(postId));
  sessionStorage.setItem('evolv-doc-back', window.location.hash.replace(/^#/, '') || '/home');
  window.location.hash = '/document';
  window.dispatchEvent(new Event('navigated'));
}

// Portrait box, autoplays muted when visible, click opens the Reels page
function FeedVideo({ post }) {
  const boxRef = useRef(null);
  const videoRef = useRef(null);
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const video = videoRef.current;
    if (!box || !video) return undefined;
    const io = new IntersectionObserver(
      ([e]) => { e.intersectionRatio >= 0.6 ? video.play().catch(() => { }) : video.pause(); },
      { threshold: [0, 0.6] }
    );
    io.observe(box);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className={`hp-video-frame ${landscape ? 'landscape' : ''}`}
      onClick={() => openReel(post.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') openReel(post.id); }}
      aria-label="Open Short Video"
    >
      <video
        ref={videoRef}
        src={post.media.src}
        poster={post.media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) =>
          setLandscape(e.currentTarget.videoWidth > e.currentTarget.videoHeight)}
      />
      <span className="hp-video-badge"><Play size={12} fill="currentColor" /> Watch Short Video</span>
    </div>
  );
}
// ─── Text-based post bodies ────────────────────────────────────────────────
function TextPostBody({ post }) {
  return <p className="hp-text-post">{post.content || post.caption}</p>;
}

function ArticlePostBody({ post }) {
  const [expanded, setExpanded] = useState(false);
  const text = post.content || post.caption || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(words / 200));
  const isLong = text.length > 400;

  return (
    <div className="hp-article-post">
      <span className="hp-article-label">
        <BookOpen size={12} aria-hidden="true" /> Article · {readMins} min read
      </span>
      <h3 className="hp-article-title">{post.title}</h3>
      {post.subtitle && <p className="hp-article-subtitle">{post.subtitle}</p>}
      <div className={`hp-article-body ${!expanded && isLong ? 'clamped' : ''}`}>
        {text.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {isLong && (
        <button
          type="button"
          className="hp-article-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Read full article'}
        </button>
      )}
    </div>
  );
}

function QuestionPostBody({ post, onDiscuss }) {
  // Old questions only have `content`; new ones have title (+ optional subtitle/details)
  const heading = post.title || post.content || post.caption;
  const details =
    post.title && post.content && post.content.trim() !== post.title.trim()
      ? post.content
      : '';

  return (
    <div className="hp-question-post">
      <span className="hp-question-label">❓ Question</span>
      <h3 className="hp-question-title">{heading}</h3>
      {post.subtitle && <p className="hp-question-subtitle">{post.subtitle}</p>}
      {details && (
        <div className="hp-question-details">
          {details.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
      <button
        type="button"
        className="hp-question-answer-btn"
        onClick={() => onDiscuss?.(post.id)}
      >
        <MessageCircle size={15} aria-hidden="true" />
        {post.comments > 0
          ? `View ${post.comments} answer${post.comments > 1 ? 's' : ''}`
          : 'Be the first to answer'}
      </button>
    </div>
  );
}

function AchievementPostBody({ post }) {
  return (
    <div className="hp-achievement-post">
      <div className="hp-achievement-badge" aria-hidden="true">🏆</div>
      <span className="hp-achievement-label">Achievement unlocked</span>
      <h3 className="hp-achievement-title">{post.title}</h3>
      {(post.description || post.content) && (
        <p className="hp-achievement-desc">{post.description || post.content}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED POST
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function FeedPost({ post, onLike, onSave, onFollow, onAppreciate, onHelpful, onLearned, onDiscuss }) {
  const [showMenu, setShowMenu] = useState(false);

  const [activeActionTooltip, setActiveActionTooltip] = useState('');
  const longPressTimer = useRef(null);

  const startLongPress = (label) => {
    clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      setActiveActionTooltip(label);
    }, 400);
  };

  const endLongPress = () => {
    clearTimeout(longPressTimer.current);
    setActiveActionTooltip('');
  };

  const formatCount = (n) => {
    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return String(n);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/#/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption, url });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(url).catch(() => { });
    }
  };
  const currentUser = authService.getCurrentUser();

  const currentUserId =
    currentUser?.id ??
    currentUser?.userId ??
    currentUser?._id;

  const creatorId =
    post.creator?.id ??
    post.creator?.userId ??
    post.creator?._id;

  const isOwnPost =
    currentUserId != null &&
    creatorId != null &&
    String(currentUserId) === String(creatorId);
  const isTextKind = ['text', 'article', 'question', 'achievement'].includes(post.kind);
  return (
    <article className="hp-post" aria-label={`${post.type === 'reel' ? 'Reel' : 'Post'} by ${post.creator.name}`}>
      {/* Post header */}
      <div className="hp-post-header">
        <div className="hp-post-creator">
          <button
            type="button"
            onClick={() => openUserProfile(post.creator?.id)}
            aria-label={`View ${post.creator.name}'s profile`}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
          >
            <Avatar src={post.creator.avatar} name={post.creator.name} size={44} />
          </button>

          <div className="hp-post-creator-info">
            <div className="hp-post-creator-nameline">
              <span
                className="hp-post-creator-name"
                style={{ cursor: 'pointer' }}
                onClick={() => openUserProfile(post.creator?.id)}
              >
                {post.creator.name}
              </span>              {post.type === 'reel' && (
                <span className="hp-post-reel-badge" aria-label="Reel">
                  <Clapperboard size={11} aria-hidden="true" />
                  ShortVideo
                </span>
              )}
            </div>
            <span className="hp-post-creator-field">{post.creator.field} · {post.timestamp}</span>
          </div>
        </div>
        <div className="hp-post-header-right">
          {!isOwnPost && (() => {
            const status = post.connectionStatus ?? 'none';

            const config = {
              none: { label: '+ Connect', cls: '', aria: `Connect with ${post.creator.name}` },
              pending: { label: 'Requested', cls: 'following', aria: `Cancel request to ${post.creator.name}` },
              incoming: { label: 'Accept', cls: '', aria: `Accept request from ${post.creator.name}` },
              connected: { label: 'Connected', cls: 'following', aria: `Disconnect from ${post.creator.name}` },
            }[status];

            return (
              <button
                className={`hp-follow-btn ${config.cls}`}
                onClick={() => onFollow(post.id)}
                aria-label={config.aria}
              >
                {status === 'connected' && <CheckCheck size={13} aria-hidden="true" />}
                {config.label}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Tags */}
      <div className="hp-post-tags" aria-label="Post tags">
        {post.tags.map(tag => (
          <span key={tag} className="hp-post-tag">{tag}</span>
        ))}
      </div>

      {/* Caption */}
      {post.kind === 'text' && <TextPostBody post={post} />}
      {post.kind === 'article' && <ArticlePostBody post={post} />}
      {post.kind === 'question' && <QuestionPostBody post={post} onDiscuss={onDiscuss} />}
      {post.kind === 'achievement' && <AchievementPostBody post={post} />}
      {!isTextKind && post.caption && (
        <p className="hp-post-caption">{post.caption}</p>
      )}

      {/* Media */}
      {isTextKind ? null : post.media.type === 'document' ? (
        <div
          className="hp-document-card hp-document-clickable"
          onClick={() => openDocument(post.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') openDocument(post.id); }}
          aria-label={`Open document ${post.media.fileName || ''}`}
        >
          <div className="hp-document-icon">
            <BookOpen size={28} aria-hidden="true" />
          </div>

          <div className="hp-document-info">
            <p className="hp-document-name">
              {post.media.fileName || 'Document'}
            </p>
            <span>Document attachment</span>
          </div>

          <div className="hp-document-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hp-document-view"
              onClick={() => openDocument(post.id)}
            >
              View
            </button>
          </div>
        </div>
      ) : post.media.type === 'video' ? (
        <FeedVideo post={post} />
      ) : post.media.type === 'image' && post.media.src ? (
        <div
          className="hp-post-image-wrapper hp-image-clickable"
          onClick={() => openImage(post.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') openImage(post.id); }}
          aria-label="View full image"
        >
          <img src={post.media.src} alt="Post content" className="hp-post-media-img" loading="lazy" />
          <span className="hp-image-badge">Tap to view full image</span>
        </div>
      ) : null}

      {/* Action row */}
      <div className="hp-post-actions">
        <div className="hp-post-actions-left">

          {/* Appreciate */}

          <button
            type="button"
            className={`hp-action-btn hp-appreciate-btn ${post.appreciated ? 'active' : ''
              }`}
            title="Appreciate"
            onTouchStart={() => startLongPress('Appreciate')}
            onTouchEnd={endLongPress}
            onTouchMove={endLongPress}
            onTouchCancel={endLongPress}
            onMouseEnter={() => setActiveActionTooltip('Appreciate')}
            onMouseLeave={endLongPress}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => onAppreciate?.(post.id)}
            aria-label={post.appreciated ? 'Remove appreciation' : 'Appreciate post'}
            aria-pressed={post.appreciated}
          >
            <span className="hp-action-tooltip" role="tooltip">
              {activeActionTooltip === 'Appreciate' ? 'Appreciate' : ''}
            </span>

            <Heart
              size={20}
              fill={post.appreciated ? 'currentColor' : 'none'}
              aria-hidden="true"
            />


            <span className="hp-action-count">{formatCount(post.appreciations ?? 0)}</span>
          </button>


          {/* Helpful */}
          <button
            className={`hp-action-btn hp-helpful-btn ${post.helpful ? 'active' : ''
              }`}
            onClick={() => onHelpful?.(post.id)}
            onTouchStart={() => startLongPress('Helpful')}
            onTouchEnd={endLongPress}
            onTouchMove={endLongPress}
            onTouchCancel={endLongPress}
            onMouseEnter={() => setActiveActionTooltip('Helpful')}
            onMouseLeave={endLongPress}
            onContextMenu={(e) => e.preventDefault()}
            title="Helpful"
            aria-label={post.helpful ? 'Remove helpful reaction' : 'Mark as helpful'}
            aria-pressed={post.helpful}
          >
            <span className="hp-action-tooltip" role="tooltip">
              {activeActionTooltip === 'Helpful' ? 'Helpful' : ''}
            </span>
            <Sparkles
              size={20}
              aria-hidden="true"
            />

            <span className="hp-action-count">{formatCount(post.helpfulCount ?? 0)}</span>

          </button>

          {/* Learned */}
          <button
            className={`hp-action-btn hp-learned-btn ${post.learned ? 'active' : ''
              }`}
            onClick={() => onLearned?.(post.id)}
            onTouchStart={() => startLongPress('Learned')}
            onTouchEnd={endLongPress}
            onTouchMove={endLongPress}
            onTouchCancel={endLongPress}
            onMouseEnter={() => setActiveActionTooltip('Learned')}
            onMouseLeave={endLongPress}
            onContextMenu={(e) => e.preventDefault()}
            title="Learned"
            aria-label={post.learned ? 'Remove learned status' : 'Mark as learned'}
            aria-pressed={post.learned}
          >
            <span className="hp-action-tooltip" role="tooltip">
              {activeActionTooltip === 'Learned' ? 'Learned' : ''}
            </span>
            <CheckCircle2
              size={20}
              aria-hidden="true"
            />

            <span className="hp-action-count">{formatCount(post.learnedCount ?? 0)}</span>

          </button>

          {/* Discuss */}
          <button
            className="hp-action-btn hp-discuss-btn"
            onClick={() => onDiscuss?.(post.id)}
            onTouchStart={() => startLongPress('Discuss')}
            onTouchEnd={endLongPress}
            onTouchMove={endLongPress}
            onTouchCancel={endLongPress}
            onMouseEnter={() => setActiveActionTooltip('Discuss')}
            onMouseLeave={endLongPress}
            onContextMenu={(e) => e.preventDefault()}
            title="Discuss"
            aria-label={`Discuss post (${post.comments ?? 0} comments)`}
          >
            <span className="hp-action-tooltip" role="tooltip">
              {activeActionTooltip === 'Discuss' ? 'Discuss' : ''}
            </span>
            <MessageCircle
              size={20}
              aria-hidden="true"
            />
            <span className="hp-action-count">{formatCount(post.comments ?? 0)}</span>
          </button>

        </div>

        {/* Bookmark */}
        <button
          className={`hp-save-btn ${post.saved ? 'saved' : ''}`}
          onClick={() => onSave(post.id)}
          onTouchStart={() => startLongPress('Bookmark')}
          onTouchEnd={endLongPress}
          onTouchMove={endLongPress}
          onTouchCancel={endLongPress}
          onMouseEnter={() => setActiveActionTooltip('Bookmark')}
          onMouseLeave={endLongPress}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={post.saved ? 'Remove bookmark' : 'Bookmark post'}
          aria-pressed={post.saved}
        >
          <span className="hp-action-tooltip" role="tooltip">
            {activeActionTooltip === 'Bookmark' ? 'Bookmark' : ''}
          </span>
          <Bookmark
            size={20}
            fill={post.saved ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>

        {/* More */}
        <button
          className="hp-post-more-btn"
          onClick={() => setShowMenu(v => !v)}
          onTouchStart={() => startLongPress('More')}
          onTouchEnd={endLongPress}
          onTouchMove={endLongPress}
          onTouchCancel={endLongPress}
          onMouseEnter={() => setActiveActionTooltip('More')}
          onMouseLeave={endLongPress}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="More post options"
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          <span className="hp-action-tooltip" role="tooltip">
            {activeActionTooltip === 'More' ? 'More' : ''}
          </span>
          <MoreHorizontal
            size={21}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}

// ── Growth / learning data (replace with user profile API when backend is ready) ──
const GROWTH_PROGRESS = [
  { label: 'Artificial Intelligence', pct: 70, colorClass: '' },
  { label: 'Psychology', pct: 45, colorClass: 'green' },
  { label: 'Economics', pct: 35, colorClass: 'yellow' },
  { label: 'System Design', pct: 60, colorClass: 'pink' },
];
const RECENTLY_LEARNED = [
  { topic: 'RAG architecture', when: '2d ago' },
  { topic: 'Vector databases', when: '4d ago' },
  { topic: 'Prompt engineering', when: '1w ago' },
];

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function RightSidebar({ user, isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [followed, setFollowed] = useState(new Set());
  const [growthTab, setGrowthTab] = useState('Learning');
  const [growthItems, setGrowthItems] = useState([]);
  const [growthLoading, setGrowthLoading] = useState(true);
  // ── People search ───────────────────────────────────────────
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Debounced API call
  useEffect(() => {
    const q = search.trim();

    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const people = await userSearchService.searchUsers(q);
        if (cancelled) return;
        setSearchResults(people);
        setSearchError('');
      } catch (err) {
        if (cancelled) return;
        console.error('[RightSidebar] Search failed:', err);
        setSearchResults([]);
        setSearchError('Could not search right now. Please try again.');
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSelectPerson = (person) => {
    setSearchOpen(false);
    setSearch('');
    onClose?.();
    openUserProfile(person.id);
  };

  const filteredPeople = CREATORS.slice(0, 3);

  const toggleLearn = useCallback((id) => {
    setFollowed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Extra metadata for People to Learn From (dev-only until backend provides it)
  const PEOPLE_META = [
    { skillCount: 8, learners: 240 },
    { skillCount: 6, learners: 189 },
    { skillCount: 5, learners: 132 },
  ];

  // Close on Escape key (right sidebar drawer on mobile)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  useEffect(() => {
    let cancelled = false;

    async function loadGrowthSkills() {
      setGrowthLoading(true);

      try {
        const [userSkillsResponse, categoryResults] = await Promise.all([
          profileService.getUserSkills(),
          Promise.allSettled(
            Array.from({ length: 20 }, (_, i) =>
              profileService.getCategorySkills(i + 1)
            )
          ),
        ]);

        const getRecords = (response) => {
          const value = response?.data ?? response;

          if (Array.isArray(value)) return value;
          if (Array.isArray(value?.data)) return value.data;
          if (Array.isArray(value?.skills)) return value.skills;
          if (Array.isArray(value?.items)) return value.items;

          return [];
        };

        const namesById = new Map();

        categoryResults.forEach((result) => {
          if (result.status !== "fulfilled") return;

          getRecords(result.value).forEach((skill) => {
            if (skill?.id != null && skill?.name) {
              namesById.set(Number(skill.id), skill.name);
            }
          });
        });

        const records = getRecords(userSkillsResponse);

        const items = records.flatMap((record) => {
          const raw = record.skillId != null
            ? [record.skillId]
            : Array.isArray(record.skills ?? record.skill)
              ? (record.skills ?? record.skill).map((s) =>
                typeof s === "object" ? s.id ?? s.skillId : s
              )
              : record.skill != null
                ? [record.skill]
                : [];

          return raw
            .map((id) => namesById.get(Number(id)))
            .filter(Boolean)
            .map((label) => ({
              label,
              relationshipType: record.relationshipType,
            }));
        });

        const unique = [
          ...new Map(
            items.map((item) => [
              `${item.label.toLowerCase()}-${item.relationshipType}`,
              item,
            ])
          ).values(),
        ];

        if (!cancelled) setGrowthItems(unique);
      } catch (error) {
        console.error("[RightSidebar] Failed to load growth skills:", error);

        if (!cancelled) setGrowthItems([]);
      } finally {
        if (!cancelled) setGrowthLoading(false);
      }
    }

    loadGrowthSkills();

    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <>
      <style>{`
      .hp-search-wrap { position: relative; }

.hp-search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
  background: #fff;
  border: 1px solid rgba(9, 3, 15, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(26, 10, 46, 0.14);
}

.hp-search-status {
  margin: 0;
  padding: 12px;
  font-size: 13px;
  color: #8b7aa3;
}
.hp-search-status.error { color: #dc2626; }

.hp-search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.hp-search-result:hover,
.hp-search-result:focus-visible { background: rgba(170, 69, 245, 0.08); outline: none; }

.hp-search-result-info { display: flex; flex-direction: column; min-width: 0; }
.hp-search-result-name { font-size: 13px; font-weight: 600; color: #2d1b4e; }
.hp-search-result-sub {
  font-size: 11px;
  color: #8b7aa3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
html,
body,
#root {
  min-height: 100%;
  margin: 0;
}

body {
  overflow-x: hidden;
  overflow-y: auto;
}

#root {
  width: 100%;
}
  .hp-layout {
    width: 100%;
    height: 100dvh;
    min-height: 0;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 360px;
    overflow: hidden;
  }

  .hp-feed-column {
    min-width: 0;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .hp-feed {
    flex: 1 1 auto;
    width: 100%;
    height: auto;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;

    overflow-y: auto;
    overflow-x: hidden;

    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .hp-post {
    flex-shrink: 0;
  }

  /* Tablet: 768-1024px — drop right-sidebar column; it becomes a drawer */
  @media (min-width: 768px) and (max-width: 1024px) {
    .hp-layout {
      grid-template-columns: 240px minmax(0, 1fr);
    }

    .hp-feed-column {
      min-height: 0;
    }

    .hp-feed {
      min-height: 0;
      overflow-y: auto;
    }
  }

  /* Mobile: single-column flex */
  @media (max-width: 767px) {
    .hp-layout {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100dvh;
      min-height: 0;
      overflow: hidden;
    }

    .hp-feed-column {
      flex: 1 1 auto;
      width: 100%;
      height: auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .hp-feed {
      flex: 1 1 auto;
      width: 100%;
      height: auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 14px 14px 40px;
    }
  }
    .hp-mobile-user-btn {
    display: none;

    width: 40px;
    height: 40px;

    padding: 3px;

    border: 1.5px solid rgba(9, 3, 15, 0.12);
    border-radius: 50%;

    background: #ffffff;

    align-items: center;
    justify-content: center;

    cursor: pointer;

    transition:
      border-color 0.2s ease,
      background 0.2s ease,
      transform 0.15s ease;
  }

  .hp-mobile-user-btn:hover {
    border-color: #aa45f5;
    background: rgba(170, 69, 245, 0.06);
  }

  .hp-mobile-user-btn:active {
    transform: scale(0.94);
  }

  .hp-mobile-user-btn:focus-visible {
    outline: 2px solid #aa45f5;
    outline-offset: 2px;
  }

  /* Show only on mobile */
  @media (max-width: 767px) {
    .hp-mobile-user-btn {
      display: inline-flex;
    }
  }

  /* ── Right sidebar new section styles ────────────────────────────────────── */
  .hp-growth-tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid rgba(9,3,15,0.08); }
  .hp-growth-tab { padding: 6px 12px; border: none; background: none; font-size: 13px; font-weight: 500; color: #8b7aa3; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .hp-growth-tab.active { color: #aa45f5; border-bottom-color: #aa45f5; font-weight: 600; }
  .hp-progress-item { margin-bottom: 10px; }
  .hp-progress-label { display: flex; justify-content: space-between; font-size: 12px; color: #2d1b4e; margin-bottom: 4px; font-weight: 500; }
  .hp-progress-pct { color: #8b7aa3; font-weight: 400; }
  .hp-progress-track { height: 6px; background: rgba(9,3,15,0.08); border-radius: 3px; overflow: hidden; }
  .hp-progress-fill { height: 100%; border-radius: 3px; background: #aa45f5; }
  .hp-progress-fill.green  { background: #22c55e; }
  .hp-progress-fill.yellow { background: #eab308; }
  .hp-progress-fill.pink   { background: #ec4899; }
  .hp-learned-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .hp-learned-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
  .hp-learned-check { width: 18px; height: 18px; border-radius: 50%; background: rgba(34,197,94,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hp-learned-text { flex: 1; color: #2d1b4e; font-weight: 500; }
  .hp-learned-when { color: #8b7aa3; font-size: 11px; white-space: nowrap; }
  .hp-continue-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(170,69,245,0.06); border-radius: 10px; border: 1px solid rgba(170,69,245,0.15); }
  .hp-continue-icon { width: 34px; height: 34px; border-radius: 50%; background: rgba(170,69,245,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #aa45f5; }
  .hp-continue-body { flex: 1; min-width: 0; }
  .hp-continue-title { font-size: 13px; font-weight: 600; color: #2d1b4e; margin: 0 0 2px; }
  .hp-continue-sub { font-size: 11px; color: #8b7aa3; margin: 0; }
  .hp-continue-arrow { width: 28px; height: 28px; border-radius: 50%; background: #aa45f5; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .hp-continue-arrow:hover { background: #8a2be2; }
  .hp-learn-person-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
  .hp-learn-person-info { flex: 1; min-width: 0; }
  .hp-learn-person-name { font-size: 13px; font-weight: 600; color: #2d1b4e; display: block; }
  .hp-learn-person-field { font-size: 11px; color: #8b7aa3; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hp-learn-person-meta { font-size: 11px; color: #8b7aa3; display: block; }
  .hp-learn-btn { padding: 5px 14px; border: 1.5px solid #aa45f5; border-radius: 20px; background: #fff; color: #aa45f5; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .hp-learn-btn:hover, .hp-learn-btn.following { background: #aa45f5; color: #fff; }
  .hp-recommended-body { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
  .hp-recommended-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(170,69,245,0.1); display: flex; align-items: center; justify-content: center; color: #aa45f5; flex-shrink: 0; }
  .hp-recommended-text { font-size: 12px; color: #555; line-height: 1.5; }
  .hp-recommended-text strong { color: #2d1b4e; }
  /* ── Post composer styles ───────────────────────────────────────────────────── */
  .hp-composer { width: 100%; max-width: 100%; box-sizing: border-box; background: #fff; border-radius: 12px; border: 1px solid rgba(9,3,15,0.1); padding: 14px 16px; margin-bottom: 12px; }
  .hp-composer-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .hp-composer-body { flex: 1; }
  .hp-composer-prompt { font-size: 14px; font-weight: 600; color: #2d1b4e; margin: 0 0 3px; }
  .hp-composer-placeholder { font-size: 12px; color: #8b7aa3; margin: 0; }
  .hp-composer-types { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .hp-composer-type-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border: 1px solid rgba(9,3,15,0.12); border-radius: 20px; background: #fff; font-size: 12px; color: #555; cursor: pointer; }
  .hp-composer-type-btn:hover { border-color: #aa45f5; color: #aa45f5; }
  .hp-composer-footer { display: flex; justify-content: flex-end; }
  .hp-composer-post-btn { padding: 7px 20px; background: #1a0a2e; color: #fff; border: none; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .hp-composer-post-btn:hover { background: #aa45f5; }
  .hp-composer-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;

  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  color: #111827;

  padding: 4px 0;
}

.hp-composer-input::placeholder {
  color: #9ca3af;
}

.hp-composer-upload-area {
  padding: 12px 0;
}

.hp-composer-upload-area p {
  margin: 0 0 10px;
  font-size: 14px;
  color: #6b7280;
}

.hp-composer-upload-area button {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.hp-composer-type-btn.active {
  border-color: #7c3aed;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
}

.hp-composer-file-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 0;
}

.hp-composer-file-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.hp-composer-file-item img,
.hp-composer-file-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hp-composer-file-item > button {
  position: absolute;
  top: 5px;
  right: 5px;

  width: 24px;
  height: 24px;

  border: none;
  border-radius: 50%;

  background: rgba(0, 0, 0, 0.65);
  color: white;

  cursor: pointer;
}

.hp-composer-document-preview {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 5px;
  padding: 8px;

  font-size: 24px;
}

.hp-composer-document-preview span {
  max-width: 90px;

  font-size: 11px;
  color: #4b5563;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Caption input */
.hp-composer-caption {
  width: 100%;
  margin: 12px 0;
}

.hp-composer-caption-input {
  width: 100%;
  min-height: 90px;
  padding: 14px 16px;
  border: 1px solid #e5e1eb;
  border-radius: 12px;
  background: #fff;
  color: #20152c;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease,
              box-shadow 0.2s ease;
}

.hp-composer-caption-input::placeholder {
  color: #a39aaa;
}

.hp-composer-caption-input:focus {
  border-color: #a63df5;
  box-shadow: 0 0 0 3px rgba(166, 61, 245, 0.1);
}

.hp-composer-caption-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
  color: #9688a5;
  font-size: 12px;
}

`}</style>
      {/* Right-sidebar backdrop (mobile only) */}
      {isOpen && (
        <button
          type="button"
          className="hp-right-sidebar-overlay"
          onClick={onClose}
          aria-label="Close learning dashboard"
          style={{ cursor: 'default' }}
        />
      )}
      <aside
        className={`hp-right-sidebar${isOpen ? ' open' : ''}`}
        aria-label="Discovery panel"
        aria-modal={isOpen || undefined}
      >
        {/* Mobile close header */}
        <div className="hp-mobile-drawer-header">
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Learning Dashboard</span>
          <button type="button" onClick={onClose} aria-label="Close learning dashboard">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="hp-search-wrap" ref={searchBoxRef}>
          <div className="hp-search-bar">
            <Search size={16} className="hp-search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search people, skills, interests..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectPerson(searchResults[0]);
                }
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              className="hp-search-input"
              aria-label="Search people, skills, and interests"
              aria-expanded={searchOpen}
              autoComplete="off"
            />
            <button className="hp-search-filter" aria-label="Filter search results">
              <SlidersHorizontal size={16} aria-hidden="true" />
            </button>
          </div>

          {searchOpen && search.trim().length >= 2 && (
            <div className="hp-search-dropdown" role="listbox" aria-label="Search results">
              {searchLoading && <p className="hp-search-status">Searching...</p>}

              {!searchLoading && searchError && (
                <p className="hp-search-status error">{searchError}</p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className="hp-search-status">No people found for "{search.trim()}".</p>
              )}

              {!searchLoading && searchResults.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  role="option"
                  className="hp-search-result"
                  onClick={() => handleSelectPerson(person)}
                >
                  <Avatar src={person.avatar} name={person.name} size={34} />
                  <span className="hp-search-result-info">
                    <span className="hp-search-result-name">{person.name}</span>
                    <span className="hp-search-result-sub">
                      {person.username ? `@${person.username}` : person.field}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Your Growth */}
        <section className="hp-right-card" aria-labelledby="growth-heading">
          <div className="hp-right-card-header">
            <h2 id="growth-heading" className="hp-right-card-title">Your Growth</h2>
            <button
              className="hp-view-all-btn"
              onClick={() => { window.location.hash = '/profile'; window.dispatchEvent(new Event('navigated')); }}
            >
              View Profile →
            </button>
          </div>
          <div className="hp-growth-tabs" role="tablist" aria-label="Growth view">
            {['Learning', 'Skills'].map(t => (
              <button
                key={t}
                role="tab"
                className={`hp-growth-tab${growthTab === t ? ' active' : ''}`}
                onClick={() => setGrowthTab(t)}
                aria-selected={growthTab === t}
              >
                {t}
              </button>
            ))}
          </div>
          {growthLoading ? (
            <p>Loading your growth...</p>
          ) : (
            <>
              {growthItems
                .filter((item) =>
                  growthTab === "Learning"
                    ? item.relationshipType === "LEARNING" ||
                    item.relationshipType === "WANT_TO_IMPROVE"
                    : item.relationshipType === "CAN_DO"
                )
                .map((item) => (
                  <div key={`${item.label}-${item.relationshipType}`}
                    className="hp-progress-item">
                    <div className="hp-progress-label">
                      <span>{item.label}</span>
                      <span className="hp-progress-pct">Selected</span>
                    </div>

                    <div className="hp-progress-track">
                      <div
                        className="hp-progress-fill"
                        style={{ width: "100%" }}
                        role="img"
                        aria-label={`${item.label}, selected skill`}
                      />
                    </div>
                  </div>
                ))}

              {growthItems.filter((item) =>
                growthTab === "Learning"
                  ? item.relationshipType === "LEARNING" ||
                  item.relationshipType === "WANT_TO_IMPROVE"
                  : item.relationshipType === "CAN_DO"
              ).length === 0 && (
                  <p>No skills selected in this section yet.</p>
                )}
            </>
          )}
        </section>

        {/* Recently Learned */}
        <section className="hp-right-card" aria-labelledby="recently-learned-heading">
          <div className="hp-right-card-header">
            <h2 id="recently-learned-heading" className="hp-right-card-title">Recently Learned</h2>
            <button className="hp-view-all-btn">See all →</button>
          </div>
          <ul className="hp-learned-list">
            {RECENTLY_LEARNED.map(({ topic, when }) => (
              <li key={topic} className="hp-learned-item">
                <span className="hp-learned-check" aria-hidden="true">
                  <Check size={11} color="#22c55e" />
                </span>
                <span className="hp-learned-text">{topic}</span>
                <span className="hp-learned-when">{when}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Continue your learning journey */}
        <section className="hp-right-card" aria-label="Continue your learning journey">
          <div className="hp-continue-card">
            <div className="hp-continue-icon" aria-hidden="true">
              <Sparkles size={16} />
            </div>
            <div className="hp-continue-body">
              <p className="hp-continue-title">Continue your learning journey</p>
              <p className="hp-continue-sub">Explore new content based on your goals.</p>
            </div>
            <button
              className="hp-continue-arrow"
              aria-label="Go to Discover"
              onClick={() => { window.location.hash = '/explore-gems'; window.dispatchEvent(new Event('navigated')); }}
            >
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* People to Learn From */}
        <section className="hp-right-card" aria-labelledby="people-heading">
          <div className="hp-right-card-header">
            <h2 id="people-heading" className="hp-right-card-title">People to Learn From</h2>
            <button
              className="hp-view-all-btn"
              onClick={() => { window.location.hash = '/explore-gems'; window.dispatchEvent(new Event('navigated')); }}
            >
              See all →
            </button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredPeople.map((creator, i) => {
              const meta = PEOPLE_META[i] || { skillCount: 4, learners: 100 };
              const isLearning = followed.has(creator.id);
              return (
                <li key={creator.id} className="hp-learn-person-row">
                  <Avatar src={creator.avatar} name={creator.name} size={38} />
                  <div className="hp-learn-person-info">
                    <span className="hp-learn-person-name">{creator.name}</span>
                    <span className="hp-learn-person-field">{creator.field}</span>
                    <span className="hp-learn-person-meta">{meta.skillCount} skills · {meta.learners} learners</span>
                  </div>
                  <button
                    className={`hp-learn-btn${isLearning ? ' following' : ''}`}
                    onClick={() => toggleLearn(creator.id)}
                    aria-label={isLearning ? `Following ${creator.name}` : `Learn from ${creator.name}`}
                    aria-pressed={isLearning}
                  >
                    {isLearning ? 'Following' : 'Learn'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recommended for You */}
        <section className="hp-right-card" aria-labelledby="recommended-heading">
          <div className="hp-right-card-header">
            <h2 id="recommended-heading" className="hp-right-card-title">Recommended for You</h2>
            <button className="hp-view-all-btn">Why this?</button>
          </div>
          <div className="hp-recommended-body">
            <div className="hp-recommended-icon" aria-hidden="true">
              <Sparkles size={16} />
            </div>
            <p className="hp-recommended-text">
              Because you're learning <strong>Artificial Intelligence</strong>
            </p>
          </div>
        </section>

      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST COMPOSER (UI only — no backend yet)
// ─────────────────────────────────────────────────────────────────────────────
const COMPOSER_TYPES = [
  { label: 'Text', type: 'text', icon: '📝' },
  { label: 'Short Video', type: 'short_video', icon: '▶️' },
  { label: 'Photos', type: 'photos', icon: '🖼️' },
  { label: 'Article', type: 'article', icon: '📰' },
  { label: 'Document', type: 'document', icon: '📄' },
  { label: 'Question', type: 'question', icon: '❓' },
  { label: 'Achievement', type: 'achievement', icon: '🏆' },
];
// ─────────────────────────────────────────────────────────────────────────────
// SKILL PICKER MODAL (used by PostComposer)
// ─────────────────────────────────────────────────────────────────────────────
function SkillPickerModal({ initialSelected = [], onClose, onApply }) {
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [expanded, setExpanded] = useState(
    () => new Set(CURIOSITY_DOMAINS.slice(0, 2).map((d) => d.id))
  );
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggleDomain = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSkill = (name) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  return (
    <div
      className="hp-skillmodal-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Choose skills for your post"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="hp-skillmodal">
        <div className="hp-skillmodal-header">
          <div>
            <h2 className="hp-skillmodal-title">Choose Skills</h2>
            <p className="hp-skillmodal-sub">
              {selected.size} skill{selected.size !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            type="button"
            className="hp-skillmodal-close"
            onClick={onClose}
            aria-label="Close skill picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="hp-skillmodal-body">
          {CURIOSITY_DOMAINS.map((domain) => {
            const isOpen = expanded.has(domain.id);
            const skills = [...new Set(domain.skills)];
            const count = skills.filter((s) => selected.has(s)).length;

            return (
              <div key={domain.id} className="hp-skillmodal-domain">
                <button
                  type="button"
                  className="hp-skillmodal-domain-header"
                  onClick={() => toggleDomain(domain.id)}
                  aria-expanded={isOpen}
                >
                  <span>{domain.label}</span>
                  {count > 0 && <span className="hp-skillmodal-count">{count}</span>}
                  <span className={`hp-skillmodal-chevron ${isOpen ? 'open' : ''}`}>▾</span>
                </button>

                {isOpen && (
                  <div className="hp-skillmodal-grid">
                    {skills.map((name) => {
                      const on = selected.has(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`hp-skillmodal-chip ${on ? 'selected' : ''}`}
                          onClick={() => toggleSkill(name)}
                          aria-pressed={on}
                        >
                          {on && <Check size={11} aria-hidden="true" />}
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hp-skillmodal-footer">
          <button type="button" className="hp-skillmodal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="hp-skillmodal-save"
            onClick={() => { onApply([...selected]); onClose(); }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function PostComposer({ user, profileAvatar, profileName, onPostCreated }) {
  const [selectedType, setSelectedType] = useState('text');
  const isMediaType = ['short_video', 'photos', 'document'].includes(selectedType);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const skillIdMapRef = useRef(null);

  const [postData, setPostData] = useState({
    type: 'text',
    content: '',
    title: '',
    subtitle: '',
    description: '',
    files: [],
  });

  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  // ─────────────────────────────────────
  // Select post type
  // ─────────────────────────────────────
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setPostError('');
    setSelectedFile(null);

    setPostData((prev) => ({
      ...prev,
      type,
      content: '',
      title: '',
      subtitle: '',
      description: '',
      files: [],
    }));

    setPreviewFiles([]);
  };

  // ─────────────────────────────────────
  // Text / textarea change
  // ─────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    setPostData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ─────────────────────────────────────
  // File upload
  // ─────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    setPostData((prev) => ({
      ...prev,
      files,
    }));

    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));

    setPreviewFiles(previews);
  };

  // ─────────────────────────────────────
  // Remove selected file
  // ─────────────────────────────────────
  const removeFile = (index) => {
    setPostData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));

    setPreviewFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };
  const resolveSkillIds = async (names) => {
    if (!skillIdMapRef.current) {
      const idToName = await profileService.fetchSkillIdToNameMap(); // { id: name }
      const map = new Map();
      Object.entries(idToName || {}).forEach(([id, name]) => {
        map.set(String(name).trim().toLowerCase(), Number(id));
      });
      skillIdMapRef.current = map;
    }
    return names
      .map((n) => skillIdMapRef.current.get(String(n).trim().toLowerCase()))
      .filter((id) => id != null);
  };
  // ─────────────────────────────────────
  // Post
  // ─────────────────────────────────────

  const handlePost = async () => {
    if (isPosting) return;

    // ── Validation ──
    if (selectedSkills.length === 0) {
      setPostError('Please choose at least one skill for your post.');
      return;
    }
    if (selectedType === 'question' && !postData.title.trim()) {
      setPostError('Please add your question heading.');
      return;
    }
    if (selectedType === 'document' && !selectedFile) {
      setPostError('Please choose a document before posting.');
      return;
    }
    if (selectedType === 'text' && !postData.content.trim()) {
      setPostError('Please write something before posting.');
      return;
    }
    if (selectedType === 'article') {
      if (!postData.title.trim()) { setPostError('Please add an article heading.'); return; }
      if (postData.content.trim().length < 50) {
        setPostError('Article body is too short. Write at least 50 characters.');
        return;
      }
    }
    if (selectedType === 'achievement' && !postData.title.trim()) {
      setPostError('Please add an achievement title.');
      return;
    }
    if (['short_video', 'photos'].includes(selectedType) && postData.files.length === 0) {
      setPostError('Please choose a file before posting.');
      return;
    }

    setIsPosting(true);
    setPostError('');

    try {
      // Convert selected skill names -> backend IDs
      const skillIds = await resolveSkillIds(selectedSkills);
      if (skillIds.length === 0) {
        throw new Error('Could not match the selected skills. Please try again.');
      }

      const me = {
        id: user?.id ?? user?.userId ?? user?._id,
        name: profileName || user?.name || user?.username || 'You',
        username: user?.username || '',
        field: user?.field || 'Community Member',
        avatar: profileAvatar || user?.avatar || user?.profileImage || '',
      };

      let newPost;

      if (selectedType === 'photos') {
        newPost = await homePostService.createImagePost(
          caption.trim(),
          postData.files[0],
          skillIds
        );
        if (!newPost.creator?.name) newPost = { ...newPost, creator: me };

      } else if (selectedType === 'short_video') {
        newPost = await homePostService.createVideoPost(
          caption.trim(),
          postData.files[0],
          skillIds
        );
        if (!newPost.creator?.name) newPost = { ...newPost, creator: me };

      } else if (['text', 'article', 'question', 'achievement'].includes(selectedType)) {
        newPost = await homePostService.createPost({
          type: selectedType,
          caption: '',
          title: postData.title.trim(),
          subtitle: postData.subtitle.trim(),
          content:
            postData.content.trim() ||
            (selectedType === 'question' ? postData.title.trim() : ''),
          description: postData.description.trim(),
          skillIds,
        });
        newPost = { ...newPost, creator: me };

      } else {
        // document
        const raw = await homePostService.createPost({
          type: postData.type,
          caption: caption.trim(),
          content: postData.content,
          title: postData.title,
          description: postData.description,
          files: postData.files,
          file: selectedFile,
          skillIds,
        });

        const created = raw?.post ?? raw?.data?.post ?? raw?.data ?? raw ?? {};
        const documentUrl =
          created.documentUrl ?? created.documentURL ?? created.fileUrl ??
          created.fileURL ?? created.mediaUrl ?? created.media?.[0]?.mediaUrl ??
          created.document?.url ?? created.document?.documentUrl ??
          created.file?.url ?? created.file?.path ?? created.attachment?.url ??
          created.url ?? '';
        const documentName =
          selectedFile?.name ?? created.fileName ??
          created.document?.name ?? created.file?.originalName ?? 'Download document';

        newPost = {
          id: created._id || created.id || created.postId || `local-${Date.now()}`,
          type: 'post',
          caption: created.caption ?? caption.trim(),
          tags: Array.isArray(created.tags) ? created.tags : [],
          category: created.category ?? 'Discover',
          timestamp: created.createdAt
            ? new Date(created.createdAt).toLocaleDateString()
            : 'Just now',
          creator: me,
          media: {
            type: 'document',
            src: documentUrl,
            fileName: documentName,
          },
          liked: false, saved: false, followed: false,
          appreciated: false, appreciations: 0,
          helpful: false, helpfulCount: 0,
          learned: false, learnedCount: 0,
          comments: 0, likes: 0,
        };
      }

      // Make sure the post carries the chosen skills so it shows in the
      // For You / Learning tabs immediately (matchesSkills uses tags + category)
      newPost = {
        ...newPost,
        tags: newPost.tags?.length ? newPost.tags : selectedSkills,
        category: newPost.category && newPost.category !== 'Discover'
          ? newPost.category
          : selectedSkills[0],
      };

      onPostCreated?.(newPost);

      // ── Reset composer ──
      setPostData({ type: 'text', content: '', title: '', subtitle: '', description: '', files: [] });
      setCaption('');
      setSelectedType('text');
      setSelectedFile(null);
      setSelectedSkills([]);
      previewFiles.forEach(({ url }) => URL.revokeObjectURL(url));
      setPreviewFiles([]);
      if (documentInputRef.current) documentInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Create post error:', error);
      setPostError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // ─────────────────────────────────────
  // File input configuration
  // ─────────────────────────────────────
  const getAcceptType = () => {
    switch (selectedType) {
      case 'short_video':
        return 'video/*';

      case 'photos':
        return 'image/*';

      case 'document':
        return '.pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.csv';

      default:
        return '';
    }
  };

  const isMultiple = selectedType === 'photos';
  const articleWords = postData.content.trim()
    ? postData.content.trim().split(/\s+/).length
    : 0;
  const articleReadMins = Math.max(1, Math.ceil(articleWords / 200));
  const isArticleForm = selectedType === 'article' || selectedType === 'question';
  const isQuestion = selectedType === 'question';

  return (
    <div className="hp-composer" aria-label="Create a post">

      {/* ─────────────────────────────
          Header
      ───────────────────────────── */}
      <div className="hp-composer-header">

        <Avatar
          src={profileAvatar || user?.avatar}
          name={profileName || user?.name || 'You'}
          size={38}
        />

        <div className="hp-composer-body">

          {/* TEXT */}
          {!isMediaType && selectedType === 'text' && (
            <textarea
              name="content"
              value={postData.content}
              onChange={handleChange}
              className="hp-composer-input"
              placeholder="What did you learn today?"
              aria-label="Write your learning"
              rows={3}
            />
          )}

          {/* SHORT VIDEO */}
          {selectedType === 'short_video' && (
            <div className="hp-composer-upload-area">
              <p>Upload a short video</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Video
              </button>
            </div>
          )}

          {/* PHOTOS */}
          {selectedType === 'photos' && (
            <div className="hp-composer-upload-area">
              <p>Upload photos</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photos
              </button>
            </div>
          )}

          {/* DOCUMENT */}
          {selectedType === "document" && (
            <div className="hp-composer-upload-area">
              <p>Upload a document</p>

              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  setPostError('');
                }}
              />

              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
              >
                Choose Document
              </button>

              {selectedFile && <p>Selected: {selectedFile.name}</p>}
            </div>
          )}

          {/* ARTICLE / QUESTION FORM */}
          {isArticleForm && (
            <div className="hp-article-form">
              <input
                type="text"
                name="title"
                value={postData.title}
                onChange={handleChange}
                className="hp-article-heading-input"
                placeholder={isQuestion ? 'Question heading' : 'Article heading'}
                maxLength={120}
                aria-label={isQuestion ? 'Question heading' : 'Article heading'}
              />

              <input
                type="text"
                name="subtitle"
                value={postData.subtitle}
                onChange={handleChange}
                className="hp-article-subtitle-input"
                placeholder="Add a subtitle (optional)"
                maxLength={200}
                aria-label={isQuestion ? 'Question subtitle' : 'Article subtitle'}
              />

              <textarea
                name="content"
                value={postData.content}
                onChange={handleChange}
                className="hp-article-body-input"
                placeholder={
                  isQuestion
                    ? 'Add details or context for your question (optional)...'
                    : 'Write your article here...'
                }
                rows={8}
                aria-label={isQuestion ? 'Question details' : 'Article body'}
              />

              <div className="hp-article-form-meta">
                <span>
                  {isQuestion
                    ? `${articleWords} ${articleWords === 1 ? 'word' : 'words'}`
                    : `${articleWords} ${articleWords === 1 ? 'word' : 'words'} · ${articleReadMins} min read`}
                </span>
                <span>{postData.title.length}/120</span>
              </div>
            </div>
          )}

          {/* ACHIEVEMENT */}
          {!isMediaType && selectedType === 'achievement' && (
            <>
              <input
                type="text"
                name="title"
                value={postData.title}
                onChange={handleChange}
                className="hp-composer-input"
                placeholder="Achievement title"
              />

              <textarea
                name="description"
                value={postData.description}
                onChange={handleChange}
                className="hp-composer-input"
                placeholder="Tell the community about your achievement..."
                rows={3}
              />
            </>
          )}

          <p className="hp-composer-placeholder">
            Share a learning, idea, question, experience, or achievement.
          </p>

        </div>
      </div>

      {/* ─────────────────────────────
          Hidden File Input
      ───────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptType()}
        multiple={isMultiple}
        hidden
        onChange={handleFileChange}
      />

      {/* Caption Input - only for media posts */}
      {['short_video', 'photos', 'document'].includes(selectedType) && (
        <div className="hp-composer-caption">
          <textarea
            className="hp-composer-caption-input"
            placeholder="Write a caption for your post..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={2200}
          />

          <div className="hp-composer-caption-footer">
            <span>{caption.length}/2200</span>
          </div>
        </div>
      )}


      {/* ─────────────────────────────
          File Preview
      ───────────────────────────── */}
      {previewFiles.length > 0 && (
        <div className="hp-composer-file-preview">

          {previewFiles.map((item, index) => (
            <div
              className="hp-composer-file-item"
              key={`${item.name}-${index}`}
            >

              {/* Image Preview */}
              {item.type.startsWith('image/') && (
                <img
                  src={item.url}
                  alt={item.name}
                />
              )}

              {/* Video Preview */}
              {item.type.startsWith('video/') && (
                <video
                  src={item.url}
                  controls
                />
              )}

              {/* Document */}
              {!item.type.startsWith('image/') &&
                !item.type.startsWith('video/') && (
                  <div className="hp-composer-document-preview">
                    📄
                    <span>{item.name}</span>
                  </div>
                )}

              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>

            </div>
          ))}

        </div>
      )}

      {/* ─────────────────────────────
          Content Types
      ───────────────────────────── */}
      {/* Choose Skill */}
      <div className="hp-composer-skill-row">
        <button
          type="button"
          className="hp-choose-skill-btn"
          onClick={() => setShowSkillPicker(true)}
        >
          <Tag size={14} aria-hidden="true" />
          {selectedSkills.length ? 'Change Skill' : 'Choose Skill'}
        </button>

        {selectedSkills.map((s) => (
          <span key={s} className="hp-selected-skill">
            {s}
            <button
              type="button"
              onClick={() => setSelectedSkills((prev) => prev.filter((x) => x !== s))}
              aria-label={`Remove ${s}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="hp-composer-types">

        {COMPOSER_TYPES.map(({ label, type, icon }) => (
          <button
            key={type}
            type="button"
            className={`hp-composer-type-btn ${selectedType === type
              ? 'active'
              : ''
              }`}
            onClick={() => handleTypeSelect(type)}
            aria-label={`Create ${label}`}
          >
            <span aria-hidden="true">
              {icon}
            </span>

            {label}
          </button>
        ))}

      </div>

      {/* ─────────────────────────────
          Footer
      ───────────────────────────── */}
      <div className="hp-composer-footer">

        {postError && (
          <p
            role="alert"
            style={{
              color: '#dc2626',
              fontSize: 13,
              marginTop: 8,
            }}
          >
            {postError}
          </p>
        )}

        <div className="hp-composer-footer">
          <button
            type="button"
            className="hp-composer-post-btn"
            onClick={handlePost}
            disabled={isPosting}
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

      </div>
      {/* Skill picker popup */}
      {showSkillPicker && (
        <SkillPickerModal
          initialSelected={selectedSkills}
          onClose={() => setShowSkillPicker(false)}
          onApply={setSelectedSkills}
        />
      )}
    </div>
  );

}
const norm = (s) => String(s ?? '').toLowerCase().replace('#', '').trim();

function matchesSkills(post, mySkills) {
  const cat = norm(post.category);
  const tags = (post.tags || []).map(norm);
  return mySkills.map(norm).some(
    (s) => s && (cat.includes(s) || tags.some((t) => t && (t.includes(s) || s.includes(t))))
  );
}

function isOwnPost(post, myId) {
  return myId != null &&
    post.creator?.id != null &&
    String(post.creator.id) === String(myId);
}

// "For You" = my posts + my connections' posts + posts matching my skills
function isForYou(post, myId, mySkills) {
  return (
    isOwnPost(post, myId) ||
    post.connectionStatus === 'connected' ||
    matchesSkills(post, mySkills)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FEED
// ─────────────────────────────────────────────────────────────────────────────
function HomeFeed({ user, onOpenSidebar, onOpenRightSidebar }) {
  const [activeTab, setActiveTab] = useState('For You');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsAuthError, setPostsAuthError] = useState(null);
  // ── Comment panel state ─────────────────────────────────────────────────
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  // ── Real profile for the header and author enrichment ──────────────────
  const [feedProfileAvatar, setFeedProfileAvatar] = useState(null);
  const [feedProfileName, setFeedProfileName] = useState(null);

  const [mySkills, setMySkills] = useState([]);
  const connectionMapRef = useRef(new Map());

  const handleCommentCountSync = useCallback((postId, count) => {
    setPosts(prev => prev.map(p =>
      String(p.id) !== String(postId) ? p : { ...p, comments: count }
    ));
  }, []);

  // ── Feed Posts from Backend API ──
  useEffect(() => {
    let cancelled = false;

    const loadFeed = async () => {
      try {
        setPostsLoading(true);
        setPostsAuthError(null);

        const authUser = authService.getCurrentUser();
        const currentUserId = authUser?.id ?? authUser?.userId ?? authUser?._id ?? null;

        const [response, profileData, connectionMap] = await Promise.all([
          homePostService.getFeedPosts(),
          getProfile.getProfile().catch(() => null),
          connectionService.getConnectionMap(currentUserId),
        ]);

        const backendPosts = response?.posts ?? [];
        console.log('[Feed API raw response]:', response);

        const pickPosts = (res) => {
          const value = res?.data ?? res;
          if (Array.isArray(value)) return value;
          if (Array.isArray(value?.posts)) return value.posts;
          if (Array.isArray(value?.data)) return value.data;
          if (Array.isArray(value?.data?.posts)) return value.data.posts;
          if (Array.isArray(value?.items)) return value.items;
          if (Array.isArray(value?.results)) return value.results;
          return [];
        };
        console.log('[Feed] posts found:', backendPosts.length);

        if (cancelled) return;
        connectionMapRef.current = connectionMap;

        if (profileData) {
          const avatar = profileData.avatarUrl ?? profileData.avatar ?? null;
          const name = profileData.fullName ?? profileData.name ?? profileData.username ?? null;
          if (avatar) setFeedProfileAvatar(avatar);
          if (name) setFeedProfileName(name);
        }

        const mappedPosts = backendPosts.map((post) => {
          const base = homePostService._normalisePost(post);
          const conn = connectionMap.get(String(base.creator?.id ?? post.userId));

          const normalised = {
            ...base,
            liked: post.liked ?? false,
            saved: post.saved ?? false,
            connectionStatus: conn?.status ?? 'none',
            connectionId: conn?.connectionId ?? null,
          };

          // Enrich posts authored by the current user whose creator info the
          // backend omitted (it only returns userId at the top level).
          const creatorId =
            normalised.creator?.id ??
            post.userId ??
            post.user_id ??
            null;

          const missingName = !normalised.creator?.name;
          const isCurrentUser =
            currentUserId != null &&
            creatorId != null &&
            String(creatorId) === String(currentUserId);

          if (missingName && isCurrentUser && profileData) {
            return {
              ...normalised,
              creator: {
                ...normalised.creator,
                id: currentUserId,
                name: profileData.fullName ?? profileData.name ?? profileData.username ?? authUser?.name ?? '',
                username: profileData.username ?? authUser?.email?.split('@')[0] ?? '',
                avatar: profileData.avatarUrl ?? profileData.avatar ?? '',
              },
            };
          }

          return normalised;
        });

        // Display ONLY posts received from the backend.
        setPosts(mappedPosts);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load feed:", error);
        setPosts([]);
        setPostsAuthError("Unable to load posts. Please try again.");
      } finally {
        if (!cancelled) {
          setPostsLoading(false);
        }
      }
    };

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Home Tabs from GET /api/home/tabs ──────────────────────────────────

  // ── Home Tabs from GET /api/home/tabs ────────────────────────
  const [apiTabs, setApiTabs] = useState(null);
  const [tabsError, setTabsError] = useState(null);

  useEffect(() => {
    let cancelled = false;


    const loadHomeTabs = async () => {
      try {
        const raw = await fetchHomeTabs();

        if (cancelled) return;
        const payload = raw?.data ?? raw;

        console.log("[Home Tabs API response]:", payload);

        const categoryTabs = Array.isArray(payload?.tabs)
          ? payload.tabs
            .map((tab) =>
              typeof tab === "string"
                ? tab
                : tab?.label ?? tab?.name
            )
            .filter((label) =>
              typeof label === "string" && label.trim()
            )
          : Array.isArray(payload)
            ? mapTabsToLabels(payload)
            : [];

        const selectedSkillTabs = Array.isArray(payload?.selectedSkills)
          ? payload.selectedSkills
            .map((skill) =>
              typeof skill === "string"
                ? skill
                : skill?.name ??
                skill?.skillName ??
                skill?.title
            )
            .filter((name) =>
              typeof name === "string" && name.trim()
            )
          : [];
        setMySkills(selectedSkillTabs);

        const allTabs = [
          "For You",
          "Learning",
          "Discover",
          ...categoryTabs,
          ...selectedSkillTabs,
        ];

        const uniqueTabs = [
          ...new Map(
            allTabs
              .filter((tab) =>
                typeof tab === "string" && tab.trim()
              )
              .map((tab) => [
                tab.trim().toLowerCase(),
                tab.trim(),
              ])
          ).values(),
        ];

        console.log("[Home Tabs]:", uniqueTabs);
        console.log("[Selected Skills]:", selectedSkillTabs);

        setApiTabs(uniqueTabs);
        setTabsError(null);

      } catch (err) {
        if (cancelled) return;

        console.error('[HomeFeed] Could not load home tabs:', err);
        setTabsError(err.message);
        setApiTabs(null);
      }
    };


    loadHomeTabs();

    return () => {
      cancelled = true;
    };
  }, []);


  // (duplicate feed fetch removed — single loadFeed effect above handles initial load)
  // Use API tabs when available, fall back to static DOMAIN_TABS

  const FEED_TABS = apiTabs ?? [
    'For You',
    'Learning',
    'Discover',
  ];

  const handleLike = useCallback((id) => {
    setPosts(prev => prev.map(p =>
      p.id !== id ? p : { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
    ));
  }, []);

  const handleSave = useCallback((id) => {
    setPosts(prev => prev.map(p =>
      p.id !== id ? p : { ...p, saved: !p.saved }
    ));
  }, []);

  const postsRef = useRef([]);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  const pendingConnect = useRef(new Set()); // keyed by creatorId

  // Update EVERY post by the same creator (they can have many posts in the feed)
  const setCreatorConnection = useCallback((creatorId, patch) => {
    setPosts((ps) =>
      ps.map((p) =>
        String(p.creator?.id) === String(creatorId) ? { ...p, ...patch } : p
      )
    );
  }, []);

  const handleFollow = useCallback(async (postId) => {
    const post = postsRef.current.find((p) => String(p.id) === String(postId));
    const creatorId = post?.creator?.id;

    if (creatorId == null) {
      console.warn('[HomeFeed] Creator user ID not found for post', postId);
      return;
    }

    const key = String(creatorId);
    if (pendingConnect.current.has(key)) return;
    pendingConnect.current.add(key);

    const authUser = authService.getCurrentUser();
    const me = authUser?.id ?? authUser?.userId ?? authUser?._id ?? null;

    const status = post.connectionStatus ?? 'none';
    const prev = { connectionStatus: status, connectionId: post.connectionId ?? null };

    // Re-reads the server state and syncs every post by this creator
    const syncFromServer = async () => {
      const map = await connectionService.getConnectionMap(me);
      const entry = map.get(key);
      setCreatorConnection(
        creatorId,
        entry
          ? { connectionStatus: entry.status, connectionId: entry.connectionId }
          : { connectionStatus: 'none', connectionId: null }
      );
      return entry;
    };

    try {
      if (status === 'none') {
        // ── Send request ──
        setCreatorConnection(creatorId, { connectionStatus: 'pending' });
        try {
          const res = await connectionService.sendConnectionRequest(creatorId);
          const newId = res?.data?.id ?? res?.id ?? res?.connectionId ?? null;
          if (newId != null) setCreatorConnection(creatorId, { connectionId: newId });
          else await syncFromServer();
        } catch (err) {
          if (err.status === 409) {
            // Already exists on the server → just sync the UI, no rollback
            await syncFromServer();
            return;
          }
          throw err;
        }

      } else if (status === 'incoming') {
        // ── Accept their request ──
        let id = prev.connectionId;
        if (id == null) id = (await syncFromServer())?.connectionId;
        if (id == null) throw new Error('Connection record not found.');

        setCreatorConnection(creatorId, { connectionStatus: 'connected' });
        await connectionService.acceptConnectionRequest(id);

      } else {
        // ── Cancel pending request / remove connection ──
        if (status === 'connected' &&
          !window.confirm(`Remove ${post.creator.name} from your connections?`)) {
          return;
        }

        let id = prev.connectionId;
        if (id == null) id = (await syncFromServer())?.connectionId;
        if (id == null) throw new Error('Connection record not found.');

        setCreatorConnection(creatorId, { connectionStatus: 'none', connectionId: null });
        await connectionService.removeConnection(id);
      }
    } catch (err) {
      console.warn('[HomeFeed] Connection action failed – rolling back:', err.message);
      setCreatorConnection(creatorId, prev);
    } finally {
      pendingConnect.current.delete(key);
    }
  }, [setCreatorConnection]);

  // ── Discuss: open comment panel ─────────────────────────────────────────
  const handleDiscuss = useCallback((postId) => {
    setOpenCommentPostId(String(postId));
  }, []);

  // ── Comment count update from panel ────────────────────────────────────
  const handleCommentCountChange = useCallback((postId, delta) => {
    setPosts(prev => prev.map(p =>
      String(p.id) !== String(postId) ? p
        : { ...p, comments: Math.max(0, (p.comments ?? 0) + delta) }
    ));
  }, []);

  // ── Reaction + Learned in-flight guards ────────────────────────────────
  // Sets of postIds currently awaiting a server response.  Prevents the
  // user from firing duplicate requests while one is in-flight.
  const pendingAppreciate = useRef(new Set());
  const pendingHelpful = useRef(new Set());
  const pendingLearned = useRef(new Set());

  // ── Appreciate ───────────────────────────────────────────────────────────
  const handleAppreciate = useCallback(async (postId) => {
    if (pendingAppreciate.current.has(postId)) return;
    pendingAppreciate.current.add(postId);

    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) { pendingAppreciate.current.delete(postId); return; }
    const was = Boolean(current.appreciated);
    const next = !was;

    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : {
        ...p,
        appreciated: next,
        appreciations: Math.max(0, (p.appreciations ?? 0) + (next ? 1 : -1)),
      }
    ));

    try {
      if (was) await homePostService.removeReaction(postId, 'APPRECIATE');
      else await homePostService.addReaction(postId, 'APPRECIATE');
    } catch (err) {
      if (!(was && err.status === 404)) setPosts(snapshot);
    } finally {
      pendingAppreciate.current.delete(postId);
    }
  }, []);

  // ── Helpful ────────────────────────────────────────────────────────────────
  const handleHelpful = useCallback(async (postId) => {
    if (pendingHelpful.current.has(postId)) return;
    pendingHelpful.current.add(postId);

    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) { pendingHelpful.current.delete(postId); return; }
    const was = Boolean(current.helpful);
    const next = !was;

    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : {
        ...p,
        helpful: next,
        helpfulCount: Math.max(0, (p.helpfulCount ?? 0) + (next ? 1 : -1)),
      }
    ));

    try {
      if (was) await homePostService.removeReaction(postId, 'HELPFUL');
      else await homePostService.addReaction(postId, 'HELPFUL');
    } catch (err) {
      if (!(was && err.status === 404)) setPosts(snapshot);
    } finally {
      pendingHelpful.current.delete(postId);
    }
  }, []);

  // ── Learned ────────────────────────────────────────────────────────────────
  const handleLearned = useCallback(async (postId) => {
    if (pendingLearned.current.has(postId)) return;
    pendingLearned.current.add(postId);

    // Reliable snapshot (taken before any state change)
    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) {
      pendingLearned.current.delete(postId);
      return;
    }
    const was = Boolean(current.learned);
    const next = !was;

    // Optimistic update
    setPosts((ps) =>
      ps.map((p) =>
        String(p.id) !== String(postId)
          ? p
          : {
            ...p,
            learned: next,
            learnedCount: Math.max(0, (p.learnedCount ?? 0) + (next ? 1 : -1)),
          }
      )
    );

    try {
      if (was) {
        await homePostService.unmarkLearned(postId);
      } else {
        await homePostService.markLearned(postId);
      }
    } catch (err) {
      // Already removed on the server means the UI is already correct
      if (was && err.status === 404) {
        console.warn('[HomeFeed] Learned already removed on server');
      } else {
        console.warn('[HomeFeed] Learned failed — rolling back:', err.message);
        setPosts(snapshot);
      }
    } finally {
      pendingLearned.current.delete(postId);
    }
  }, []);

  // ── Socket.IO — posts-batch, post-updates-batch, comment-updates-batch ──
  useEffect(() => {
    socketService.connect();

    // ── posts-batch: new posts emitted by the backend ─────────────────────
    const offPosts = socketService.onPostsBatch((batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;
      console.log('[HomeFeed] posts-batch received:', batch.length, 'item(s)');

      const incoming = batch
        .map(item => {
          const raw = item?.post ?? item;
          const base = homePostService._normalisePost(raw);
          const conn = connectionMapRef.current?.get(String(base.creator?.id ?? raw.userId));
          return {
            ...base,
            connectionStatus: conn?.status ?? 'none',
            connectionId: conn?.connectionId ?? null,
          };
        })
        .filter(p => p.id && !String(p.id).startsWith('local-'));

      if (incoming.length === 0) return;

      setPosts(prev => {
        const existingIds = new Set(prev.map(p => String(p.id)));
        const fresh = incoming.filter(p => !existingIds.has(String(p.id)));
        return fresh.length > 0 ? [...fresh, ...prev] : prev;
      });
    });

    // ── post-updates-batch: reaction / learned state changes ──────────────
    const offUpdates = socketService.onPostUpdatesBatch((batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;
      console.log('[HomeFeed] post-updates-batch received:', batch.length, 'update(s)');

      setPosts(prev => {
        let changed = false;
        const next = prev.map(post => {
          const updates = batch.filter(
            u => String(u.postId) === String(post.id)
          );
          if (updates.length === 0) return post;

          let updated = { ...post };
          updates.forEach(u => {
            if (u.type === 'reaction') {
              if (u.counts) {
                if (typeof u.counts.APPRECIATE === 'number') {
                  updated.appreciations = u.counts.APPRECIATE;
                }
                if (typeof u.counts.HELPFUL === 'number') {
                  updated.helpfulCount = u.counts.HELPFUL;
                }
              }
            } else if (u.type === 'learned') {
              if (typeof u.counts?.LEARNED === 'number') {
                updated.learnedCount = u.counts.LEARNED;
              }
            }
          });
          changed = true;
          return updated;
        });
        return changed ? next : prev;
      });
    });

    // ── comment-updates-batch: comment creation / update / deletion ────────
    const offComments = socketService.onCommentUpdatesBatch((batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;
      console.log('[HomeFeed] comment-updates-batch received:', batch.length, 'update(s)');

      setPosts(prev => {
        let changed = false;
        const next = prev.map(post => {
          const updates = batch.filter(u => String(u.postId) === String(post.id));
          if (updates.length === 0) return post;

          let updatedPost = { ...post };
          updates.forEach(u => {
            // If backend sends authoritative count, use it directly
            if (typeof u.count === 'number') {
              updatedPost.comments = u.count;
            } else if (u.action === 'created') {
              updatedPost.comments = Math.max(0, (updatedPost.comments ?? 0) + 1);
            } else if (u.action === 'deleted') {
              updatedPost.comments = Math.max(0, (updatedPost.comments ?? 0) - 1);
            }
          });
          changed = true;
          return updatedPost;
        });
        return changed ? next : prev;
      });
    });

    return () => {
      offPosts();
      offUpdates();
      offComments();
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter by tab:
  // — "For You" / "Learning" / "Discover" → show all posts
  // — Any domain tab → match post.category or tags
  const authUserNow = authService.getCurrentUser();
  const myId = authUserNow?.id ?? authUserNow?.userId ?? authUserNow?._id ?? null;

  let visiblePosts;
  if (activeTab === 'For You') {
    const score = (p) =>
      isOwnPost(p, myId) ? 3 :
        p.connectionStatus === 'connected' ? 2 :
          matchesSkills(p, mySkills) ? 1 : 0;

    visiblePosts = [...posts].sort((a, b) => score(b) - score(a));
  } else if (activeTab === 'Learning') {
    visiblePosts = posts.filter((p) => matchesSkills(p, mySkills));
  } else if (activeTab === 'Discover') {
    // Discover = everything that is NOT already in my For You feed
    visiblePosts = posts.filter((p) => !isForYou(p, myId, mySkills));
  } else {
    visiblePosts = posts.filter(
      (p) =>
        norm(p.category) === norm(activeTab) ||
        p.tags.some((t) => norm(t).includes(norm(activeTab).split(' ')[0]))
    );
  }

  return (
    <div className="hp-feed-column">
      <HomeHeader
        user={user}
        profileAvatar={feedProfileAvatar}
        profileName={feedProfileName}
        onOpenSidebar={onOpenSidebar}
        onOpenRightSidebar={onOpenRightSidebar}
      />
      <InterestTabs active={activeTab} onChange={setActiveTab} tabs={FEED_TABS} />

      {/* Middle Feed */}
      <main className="hp-feed" aria-label="Social feed" style={{ overflowX: "hidden", overflowY: "auto", }}>
        <PostComposer
          user={user}
          profileAvatar={feedProfileAvatar}
          profileName={feedProfileName}
          onPostCreated={(newPost) => {
            setPosts((previousPosts) => [newPost, ...previousPosts]);
            setActiveTab('For You');
          }}
        />

        {/* Tabs error banner (non-fatal, tabs fall back to static) */}
        {tabsError && (
          <p role="status" style={{ fontSize: 12, color: '#8b7aa3', padding: '0 16px 8px', margin: 0 }}>
            ℹ️ Home tabs loaded from cached data ({tabsError})
          </p>
        )}

        {/* Auth error: non-blocking inline note (does not hide posts) */}
        {postsAuthError && (
          <p role="alert" style={{ fontSize: 12, color: '#ef476f', padding: '4px 16px 8px', margin: 0 }}>
            ⚠️ {postsAuthError}
          </p>
        )}

        {/* Feed posts — always rendered when available */}
        {/* Feed Posts */}
        {postsLoading ? (
          <div className="hp-feed-empty" role="status">
            Loading posts...
          </div>
        ) : postsAuthError ? (
          <div className="hp-feed-empty" role="alert">
            {postsAuthError}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="hp-feed-empty" role="status">
            <span className="hp-feed-empty-icon">💎</span>
            <p>
              No posts in <strong>{activeTab}</strong> yet.
            </p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
              onFollow={handleFollow}
              onAppreciate={handleAppreciate}
              onHelpful={handleHelpful}
              onLearned={handleLearned}
              onDiscuss={handleDiscuss}
            />
          ))
        )}
      </main>

      {/* Comment panel — rendered at feed level so it overlays the page */}
      {openCommentPostId && (
        <CommentPanel
          postId={openCommentPostId}
          currentUser={user}
          onClose={() => setOpenCommentPostId(null)}
          onCountChange={handleCommentCountChange}
          onCountSync={handleCommentCountSync}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE (root component)
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const user = authService.getCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Guard: unauthenticated → /login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  // Close right sidebar on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsRightSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent background scroll when either drawer is open on mobile
  useEffect(() => {
    if (isSidebarOpen || isRightSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen, isRightSidebarOpen]);

  if (!user) return null; // will redirect

  return (
    <div className="hp-layout" aria-label="EVOLVE home dashboard">
      <HomeSidebar
        user={user}
        activeNav="home"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <HomeFeed
        user={user}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenRightSidebar={() => setIsRightSidebarOpen(true)}
      />
      <RightSidebar
        user={user}
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
      />
    </div>
  );
}

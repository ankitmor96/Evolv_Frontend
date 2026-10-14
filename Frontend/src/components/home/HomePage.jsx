import React, { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from "../../services/homePostService.js";
import { fetchHomeTabs, mapTabsToLabels } from '../../services/homeTabService.js';
import { getUserSkills } from '../../services/userSkillService.js';
import { CREATORS, FEED_POSTS, TRENDING_REELS, INTEREST_TABS, DOMAIN_TABS } from '../../data/homeData.js';
import { avatarUrl } from '../../data/avatarUtils.js';
import './HomePage.css';

// ─── Navigation helper (matches App.jsx's custom routing) ───────────────────
function navigate(path) {
  window.history.pushState({}, '', path);
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
  { id: 'saved', label: 'Saved', icon: Bookmark, href: '#/saved' },
];

const COMMUNITY_NAV = [
  { id: 'communities', label: 'Communities', icon: Users, href: '#/connections' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, href: '#/messages' },
];

// ── Sidebar skill fallback (used until real user-skills API responds) ─────────
const DEV_SKILLS = ['Python', 'AI / LLMs', 'System Design', 'Economics', 'Psychology'];
const DEV_LEARNING_GOALS = ['Deep Learning', 'Behavioral Psychology', 'Sustainable Energy'];

function HomeSidebar({ user, activeNav = 'home', isSidebarOpen, setIsSidebarOpen }) {
  // ── Real user skills from GET /api/skills/user-skills ─────────────────
  const [sidebarSkills, setSidebarSkills] = useState(null);   // null = loading
  const [sidebarGoals, setSidebarGoals] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getUserSkills()
      .then((res) => {
        if (cancelled) return;
        // Backend may return array directly or wrapped in { data }
        const records = Array.isArray(res) ? res
          : Array.isArray(res?.data) ? res.data
          : [];
        const canDo = [];
        const learning = [];
        for (const rec of records) {
          const names = Array.isArray(rec.skills)
            ? rec.skills.map((s) => s.name || s).filter(Boolean)
            : [];
          if (rec.relationshipType === 'CAN_DO') canDo.push(...names);
          else if (rec.relationshipType === 'LEARNING') learning.push(...names);
          else if (rec.relationshipType === 'WANT_TO_IMPROVE') learning.push(...names);
        }
        setSidebarSkills(canDo.length > 0 ? canDo : null);
        setSidebarGoals(learning.length > 0 ? learning : null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[HomeSidebar] Could not load user skills:', err.message);
        // Keep null → will show fallback dev data
      });
    return () => { cancelled = true; };
  }, []);

  // Display real data when loaded, fall back to dev placeholders while loading
  const displaySkills = sidebarSkills ?? DEV_SKILLS;
  const displayGoals = sidebarGoals ?? DEV_LEARNING_GOALS;
  // Scroll-lock: prevent background scroll when drawer is open on mobile
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

  /* Hide only action names */
  .hp-post-actions-left .hp-action-btn > span:nth-of-type(2) {
    display: none !important;
  }

  /* Keep counts visible */
  .hp-post-actions-left .hp-action-btn > span:nth-of-type(3) {
    display: inline-block !important;
    margin-left: 4px;
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
            <img src="/logo.jpeg" alt="EVOLV" className="hp-logo-img" />
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

        {/* My Skills */}
        <div className="hp-sidebar-section">
          <div className="hp-sidebar-section-header">
            <p className="hp-nav-section-label" style={{ margin: 0 }}>MY SKILLS</p>
            <button className="hp-sidebar-edit-btn" aria-label="Edit skills">Edit</button>
          </div>
          <ul className="hp-skill-list">
            {displaySkills.map((skill) => (
              <li key={skill} className="hp-skill-item">
                <span className="hp-skill-dot" aria-hidden="true" />
                {skill}
              </li>
            ))}
          </ul>
        </div>

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
          <button
            className="hp-create-btn"
            onClick={() => navigate('/create')}
            aria-label="Create new content"
          >
            <Plus size={20} aria-hidden="true" />
            <span>Create</span>
          </button>

          {/* User + logout */}
          {user && (
            <div className="hp-sidebar-user">
              <Avatar src={user.avatar} name={user.name} size={36} />
              <div className="hp-sidebar-user-info">
                <span className="hp-sidebar-user-name">{user.name || 'You'}</span>
                <span className="hp-sidebar-user-handle">
                  @{user.username || (user.email || '').split('@')[0]}
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
function HomeHeader({ user, onOpenSidebar }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="hp-feed-header" style={{ marginTop: "10px" }}>
      <div className="hp-feed-header-right" style={{ display: "flex", justifyContent: "end", alignItems: "center", gap: "8px" }}>
        {/* Notification bell */}
        <button
          className="hp-icon-btn"
          aria-label="Notifications"
          onClick={() => setNotifOpen(v => !v)}
        >
          <Bell size={20} aria-hidden="true" />
          <span className="hp-notif-dot" aria-hidden="true" />
        </button>
        &nbsp;
        {/* Messages */}
        <button className="hp-icon-btn" aria-label="Messages" style={{ marginRight: "10px" }}>
          <MessageCircle size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hp-mobile-user-btn"
          onClick={() => {
            window.location.hash = '/profile';
            window.dispatchEvent(new Event('navigated'));
          }}
          aria-label="Open profile"
        >
          <Avatar
            src={user?.avatar}
            name={user?.name || 'User'}
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

// ─────────────────────────────────────────────────────────────────────────────
// FEED POST
// ─────────────────────────────────────────────────────────────────────────────
function FeedPost({ post, onLike, onSave, onFollow }) {
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
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };
  return (
    <article className="hp-post" aria-label={`${post.type === 'reel' ? 'Reel' : 'Post'} by ${post.creator.name}`}>
      {/* Post header */}
      <div className="hp-post-header">
        <div className="hp-post-creator">
          <Avatar src={post.creator.avatar} name={post.creator.name} size={44} />
          <div className="hp-post-creator-info">
            <div className="hp-post-creator-nameline">
              <span className="hp-post-creator-name">{post.creator.name}</span>
              {post.type === 'reel' && (
                <span className="hp-post-reel-badge" aria-label="Reel">
                  <Clapperboard size={11} aria-hidden="true" />
                  Reel
                </span>
              )}
            </div>
            <span className="hp-post-creator-field">{post.creator.field} · {post.timestamp}</span>
          </div>
        </div>
        <div className="hp-post-header-right">
          <button
            className={`hp-follow-btn ${post.followed ? 'following' : ''}`}
            onClick={() => onFollow(post.id)}
            aria-label={post.followed ? `Unfollow ${post.creator.name}` : `Follow ${post.creator.name}`}
          >
            {post.followed ? (
              <><CheckCheck size={13} aria-hidden="true" /> Following</>
            ) : (
              '+ Follow'
            )}
          </button>
         
        </div>
      </div>

      {/* Tags */}
      <div className="hp-post-tags" aria-label="Post tags">
        {post.tags.map(tag => (
          <span key={tag} className="hp-post-tag">{tag}</span>
        ))}
      </div>

      {/* Caption */}
      <p className="hp-post-caption">{post.caption}</p>

      {/* Media */}
      {post.media.type === 'video' ? (
        <div className="hp-post-video-wrapper">
          <video
            src={post.media.src || '/example.mp4'}
            poster={post.media.poster}
            className="hp-post-media-img"
            controls
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div className="hp-post-image-wrapper">
          <img
            src={post.media.src}
            alt="Post content"
            className="hp-post-media-img"
            loading="lazy"
          />
        </div>
      )}

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

            <span>Appreciate</span>
            <span>{formatCount(post.appreciations ?? 0)}</span>
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
            <span>Helpful</span>
            <span>{formatCount(post.helpfulCount ?? 0)}</span>
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
            <span>Learned</span>
            <span>{formatCount(post.learnedCount ?? 0)}</span>
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
            aria-label="Discuss post"
          >
            <span className="hp-action-tooltip" role="tooltip">
              {activeActionTooltip === 'Discuss' ? 'Discuss' : ''}
            </span>
            <MessageCircle
              size={20}
              aria-hidden="true"
            />
            <span>Discuss</span>
            <span>{formatCount(post.comments ?? 0)}</span>
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
function RightSidebar({ user }) {
  const [search, setSearch] = useState('');
  const [followed, setFollowed] = useState(new Set());
  const [growthTab, setGrowthTab] = useState('Learning');

  // People to learn from — reuses existing CREATORS data
  const filteredPeople = CREATORS.slice(0, 3).filter(c =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.field.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <>
      <style>{`
  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    overflow: hidden;
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

  /* Tablet */
  @media (min-width: 768px) and (max-width: 1199px) {
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

  /* Mobile */
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
  .hp-composer { width:93%; background: #fff; border-radius: 12px; border: 1px solid rgba(9,3,15,0.1); padding: 14px 16px; margin-bottom: 12px; }
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
      <aside className="hp-right-sidebar" aria-label="Discovery panel">

        {/* Search */}
        <div className="hp-search-bar">
          <Search size={16} className="hp-search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search people, skills, interests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="hp-search-input"
            aria-label="Search people, skills, and interests"
          />
          <button className="hp-search-filter" aria-label="Filter search results">
            <SlidersHorizontal size={16} aria-hidden="true" />
          </button>
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
          {GROWTH_PROGRESS.map(({ label, pct, colorClass }) => (
            <div key={label} className="hp-progress-item">
              <div className="hp-progress-label">
                <span>{label}</span>
                <span className="hp-progress-pct">{pct}%</span>
              </div>
              <div className="hp-progress-track">
                <div
                  className={`hp-progress-fill${colorClass ? ' ' + colorClass : ''}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label}: ${pct}%`}
                />
              </div>
            </div>
          ))}
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

function PostComposer({ user, onPostCreated }) {
  const [selectedType, setSelectedType] = useState('text');
  const isMediaType = ['short_video', 'photos', 'document'].includes(selectedType);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [caption, setCaption] = useState('');

  const [postData, setPostData] = useState({
    type: 'text',
    content: '',
    title: '',
    description: '',
    files: [],
  });

  const [previewFiles, setPreviewFiles] = useState([]);

  const fileInputRef = useRef(null);

  // ─────────────────────────────────────
  // Select post type
  // ─────────────────────────────────────
  const handleTypeSelect = (type) => {
    setSelectedType(type);

    setPostData((prev) => ({
      ...prev,
      type,
      content: '',
      title: '',
      description: '',
      files: [],
    }));

    setPreviewFiles([]);

    // Open file selector automatically
    if (
      type === 'short_video' ||
      type === 'photos' ||
      type === 'document'
    ) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 0);
    }
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

  // ─────────────────────────────────────
  // Post
  // ─────────────────────────────────────




  const handlePost = async () => {
    if (
      !caption.trim() &&
      !postData.content.trim() &&
      !postData.title.trim() &&
      postData.files.length === 0
    ) {
      setPostError('Please add a caption, content, title, or media.');
      return;
    }

    if (isPosting) return;

    setIsPosting(true);
    setPostError('');

    try {
      let newPost;

      if (selectedType === 'photos') {
        // ── Image post: POST /api/posts, field name "image" ──────────────────
        const imageFile = postData.files[0];
        if (!imageFile) {
          throw new Error('Please select an image file before posting.');
        }
        newPost = await homePostService.createImagePost(
          caption.trim(),
          imageFile
        );
        // Merge in local creator info if the backend omitted it
        // (the service's _normalisePost already handles backend fields;
        //  this only fills gaps when the backend returns no creator data).
        if (!newPost.creator?.name) {
          newPost = {
            ...newPost,
            creator: {
              name: user?.name || user?.username || 'You',
              username: user?.username || '',
              field: user?.field || 'Community Member',
              avatar: user?.avatar || user?.profileImage || '',
            },
          };
        }

      } else if (selectedType === 'short_video') {
        // ── Video post: POST /api/posts/video, field name "video" ────────────
        const videoFile = postData.files[0];
        if (!videoFile) {
          throw new Error('Please select a video file before posting.');
        }
        newPost = await homePostService.createVideoPost(
          caption.trim(),
          videoFile
        );
        if (!newPost.creator?.name) {
          newPost = {
            ...newPost,
            creator: {
              name: user?.name || user?.username || 'You',
              username: user?.username || '',
              field: user?.field || 'Community Member',
              avatar: user?.avatar || user?.profileImage || '',
            },
          };
        }

      } else {
        // ── Text / article / question / achievement / document ───────────────
        // These types use the generic createPost path.
        const raw = await homePostService.createPost({
          type: postData.type,
          caption: caption.trim(),
          content: postData.content,
          title: postData.title,
          description: postData.description,
          files: postData.files,
        });

        // Normalise the raw response into feed-post shape manually because
        // these types may not return a mediaUrl or thumbnailUrl.
        const created =
          raw?.post ?? raw?.data?.post ?? raw?.data ?? raw ?? {};

        newPost = {
          id: created._id || created.id || `local-${Date.now()}`,
          type: 'post',
          caption: created.caption ?? caption.trim(),
          tags: Array.isArray(created.tags) ? created.tags : [],
          category: created.category ?? 'Discover',
          timestamp: created.createdAt
            ? new Date(created.createdAt).toLocaleDateString()
            : 'Just now',
          creator: {
            name: user?.name || user?.username || 'You',
            username: user?.username || '',
            field: user?.field || 'Community Member',
            avatar: user?.avatar || user?.profileImage || '',
          },
          media: { type: 'text', src: '' },
          liked: false,
          saved: false,
          followed: false,
          appreciated: false,
          appreciations: 0,
          helpful: false,
          helpfulCount: 0,
          learned: false,
          learnedCount: 0,
          comments: 0,
          likes: 0,
        };
      }

      // Add the new post to the top of the feed.
      onPostCreated?.(newPost);

      // Reset the composer only after success.
      setPostData({
        type: 'text',
        content: '',
        title: '',
        description: '',
        files: [],
      });

      setCaption('');
      setSelectedType('text');

      previewFiles.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });

      setPreviewFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Create post error:', error);

      setPostError(
        error.message || 'Something went wrong. Please try again.'
      );
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
        return '.pdf,.doc,.docx,.ppt,.pptx,.txt';

      default:
        return '';
    }
  };

  const isMultiple = selectedType === 'photos';

  return (
    <div className="hp-composer" aria-label="Create a post">

      {/* ─────────────────────────────
          Header
      ───────────────────────────── */}
      <div className="hp-composer-header">

        <Avatar
          src={user?.avatar}
          name={user?.name || 'You'}
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

          {/* ARTICLE */}

          {/* ARTICLE TITLE AND CONTENT */}
          {!isMediaType && selectedType === 'article' && (
            <>
              <input
                type="text"
                name="title"
                value={postData.title}
                onChange={handleChange}
                className="hp-composer-input"
                placeholder="Article title"
              />

              <textarea
                name="content"
                value={postData.content}
                onChange={handleChange}
                className="hp-composer-input"
                placeholder="Write your article..."
                rows={5}
              />
            </>
          )}


          {/* DOCUMENT */}
          {selectedType === 'document' && (
            <div className="hp-composer-upload-area">

              <p>Upload a document</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Document
              </button>

            </div>
          )}

          {/* QUESTION */}
          {!isMediaType && selectedType === 'question' && (
            <textarea
              name="content"
              value={postData.content}
              onChange={handleChange}
              className="hp-composer-input"
              placeholder="What would you like to ask the community?"
              rows={3}
            />
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

    </div>
  );

}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FEED
// ─────────────────────────────────────────────────────────────────────────────
function HomeFeed({ user, onOpenSidebar }) {
  const [activeTab, setActiveTab] = useState('For You');
  // Static posts are set immediately as the initial value so the feed is
  // never blank while the API request is in-flight or when it fails.
  const [posts, setPosts] = useState(() =>
    FEED_POSTS.map(p => ({ ...p, liked: p.liked ?? false, saved: p.saved ?? false, followed: p.followed ?? false }))
  );
  // postsAuthError is only set for 401 responses that indicate the user
  // must log in. All other errors (network, CORS, 404, 500) are handled
  // by keeping static data visible and logging a console warning.
  const [postsAuthError, setPostsAuthError] = useState(null);

  // ── Home Tabs from GET /api/home/tabs ──────────────────────────────────
  const [apiTabs, setApiTabs] = useState(null); // null = loading / not yet resolved
  const [tabsError, setTabsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHomeTabs()
      .then((raw) => {
        if (cancelled) return;
        const labels = mapTabsToLabels(raw);
        if (labels.length > 0) {
          setApiTabs(['For You', 'Following', ...labels]);
        } else {
          // API returned an empty list — fall back to static tabs.
          setApiTabs(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[HomeFeed] Could not load home tabs from API:', err.message);
        setTabsError(err.message);
        setApiTabs(null); // use fallback
      });
    return () => { cancelled = true; };
  }, []);

  // ── Feed Posts from GET /api/posts ─────────────────────────────────────
  // NOTE: homePostService.getPosts() now returns [] on ALL failures
  // (network, CORS, 404, 500, auth) and logs a console warning per error
  // type. This useEffect therefore never needs an error catch branch —
  // any non-empty array from the backend replaces static data; an empty
  // array leaves the existing static posts untouched.
  useEffect(() => {
    let cancelled = false;
    homePostService.getPosts()
      .then((backendPosts) => {
        if (cancelled) return;
        if (backendPosts.length > 0) {
          // Backend returned real posts — normalise to FeedPost format.
          // Deduplicate against the static set by stable post ID so the
          // same content never appears twice if IDs overlap.
          const staticIds = new Set(
            FEED_POSTS.map((p) => String(p.id))
          );
          const mapped = backendPosts
            .filter((p) => {
              const pid = String(p._id || p.id || '');
              return pid && !staticIds.has(pid);
            })
            .map((p) => ({
              id: p._id || p.id || `bp-${Math.random()}`,
              type: p.type === 'short_video' ? 'reel' : 'post',
              creator: {
                name: p.creator?.name || p.user?.name || p.author?.name || 'Unknown',
                username: p.creator?.username || p.user?.username || '',
                field: p.creator?.field || p.user?.field || 'Community Member',
                avatar: p.creator?.avatar || p.creator?.profileImage || p.user?.avatar || '',
              },
              category: p.category || p.skillName || 'Discover',
              tags: Array.isArray(p.tags) ? p.tags : [],
              caption: p.caption || p.content || p.title || '',
              media: {
                type: p.type === 'short_video' ? 'video' : (p.mediaUrl || p.imageUrl || p.media?.url ? 'image' : 'text'),
                src: p.mediaUrl || p.imageUrl || p.media?.url || p.media?.src || '',
                poster: p.poster || p.thumbnail || '',
              },
              liked: false,
              saved: false,
              followed: false,
              appreciated: false,
              appreciations: p.appreciations ?? p.likes ?? 0,
              helpful: false,
              helpfulCount: p.helpfulCount ?? 0,
              learned: false,
              learnedCount: p.learnedCount ?? 0,
              comments: p.comments ?? p.commentCount ?? 0,
              likes: p.likes ?? 0,
              timestamp: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString()
                : 'Recently',
            }));
          if (mapped.length > 0) {
            // Prepend new backend posts ahead of static posts in the feed.
            setPosts((prev) => [
              ...mapped,
              ...prev,
            ]);
          }
          // If every backend post ID matched a static ID, no update needed.
        }
        // backendPosts === [] means the API failed gracefully or the
        // endpoint is not yet implemented — keep static posts as-is.
        setPostsAuthError(null);
      })
      .catch(() => {
        // homePostService.getPosts() should never throw — it handles all
        // errors internally. This catch is a final safety net.
        if (cancelled) return;
        console.warn('[HomeFeed] Unexpected rejection from getPosts(); static feed retained.');
      });
    return () => { cancelled = true; };
  }, []);

  // Use API tabs when available, fall back to static DOMAIN_TABS
  const FEED_TABS = apiTabs ?? ['For You', 'Learning', 'Discover', ...INTEREST_TABS.slice(2)];

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

  const handleFollow = useCallback((postId) => {
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : { ...p, followed: !p.followed }
    ));
  }, []);

  // Filter by tab:
  // — "For You" / "Learning" / "Discover" → show all posts
  // — Any domain tab → match post.category or tags
  const visiblePosts = (activeTab === 'For You' || activeTab === 'Learning' || activeTab === 'Discover')
    ? posts
    : posts.filter(p =>
      p.category.toLowerCase() === activeTab.toLowerCase() ||
      p.tags.some(t => t.toLowerCase().replace('#', '').includes(
        activeTab.toLowerCase().split(' ')[0]
      ))
    );

  return (
    <div className="hp-feed-column">
      <HomeHeader user={user} onOpenSidebar={onOpenSidebar} />
      <InterestTabs active={activeTab} onChange={setActiveTab} tabs={FEED_TABS} />

      {/* Middle Feed */}
      <main className="hp-feed" aria-label="Social feed" style={{ overflowX: "hidden", overflowY: "auto", }}>
        <PostComposer
          user={user}
          onPostCreated={(newPost) => {
            setPosts((previousPosts) => [
              newPost,
              ...previousPosts,
            ]);

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
        {visiblePosts.length === 0 ? (
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
            />
          ))
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE (root component)
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const user = authService.getCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Guard: unauthenticated → /login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  if (!user) return null; // will redirect

  return (
    <div className="hp-layout" aria-label="EVOLVE home dashboard">
      <HomeSidebar
        user={user}
        activeNav="home"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <HomeFeed user={user} onOpenSidebar={() => setIsSidebarOpen(true)} />
      <RightSidebar user={user} />
    </div>
  );

}

/**
 * EVOLV — My Profile Page
 *
 * Data sources:
 *   authService.getCurrentUser()           → base user (id, name, email)
 *   getProfile.getProfile()                → GET /api/profile
 *   profileService.getUserSkills()         → GET /api/skills/user-skills
 *   profileService.getUserCuriosity()      → GET /api/skills/curiosity
 *   profileService.getUserIdentities()     → GET /api/user-identities
 *   homePostService.getPosts()             → GET /api/posts (returns [] when not yet implemented)
 *
 * Routing: hash-based (#/profile), consistent with App.jsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  Compass,
  BookOpen,
  Bookmark,
  MessageCircle,
  LogOut,
  Settings,
  Share2,
  Edit3,
  MapPin,
  Briefcase,
  Grid3X3,
  Image as ImageIcon,
  Video,
  FileText,
  Play,
  Heart,
  MessageSquare,
  Menu,
  X,
  Sparkles,
  Target,
  CheckCircle,
  User,
  Check,
  AlertCircle,
  Loader,
  ChevronLeft,
  ChevronRight,
  Info,
  HelpCircle,
  Shield,
  Trash2,
  Download,
  BarChart3
} from 'lucide-react';

import { getProfile } from "../../services/getProfile.js";
import { authService } from '../../services/authService.js';
import { profileService } from '../../services/profileService.js';
import { homePostService } from '../../services/homePostService.js';
import socketService from '../../services/socketService.js';
import CommentPanel from '../shared/CommentPanel.jsx';
import { CURIOSITY_DOMAINS } from '../onboarding/onboardingData.js';
import './ProfilePage.css';

// ─── Navigation helper ───────────────────────────────────────────────────────
function navigate(path) {
  window.location.hash = path;
  window.dispatchEvent(new Event('navigated'));
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
// ─── Sidebar nav items ───────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: 'home', label: 'Home', icon: Home, href: '/home' },
  { id: 'discover', label: 'Discover', icon: Compass, href: '/discover' },
  { id: 'mylearning', label: 'My Learning', icon: BookOpen, href: '/learning' },
  { id: 'saved', label: 'Saved', icon: Bookmark, href: '/saved' },
];

const COMMUNITY_NAV = [
  { id: 'messages', label: 'Messages', icon: MessageCircle, href: '/messages' },
];

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40, className = '', style = {} }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (err || !src) {
    return (
      <div
        className={`pp-avatar-fallback ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38, ...style }}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User avatar'}
      className={`pp-avatar-img ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={() => setErr(true)}
    />
  );
}

// ─── Profile Sidebar ─────────────────────────────────────────────────────────
function ProfileSidebar({ user, profile, isSidebarOpen, setIsSidebarOpen }) {
  const handleNavClick = (href) => {
    navigate(href);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const avatarSrc = profile?.avatarUrl || user?.avatar || '';
  const displayName = profile?.fullName || user?.name || 'You';
  const handle = profile?.username || (user?.email || '').split('@')[0];

  return (
    <>
      <div
        className={`pp-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`pp-sidebar ${isSidebarOpen ? 'open' : ''}`}
        aria-label="Main navigation"
        aria-modal={isSidebarOpen}
      >
        <div className="pp-sidebar-logo">
          <button
            type="button"
            className="pp-logo-btn"
            aria-label="Go to EVOLV home"
            onClick={() => handleNavClick('/home')}
          >
            <img src="/logo.jpeg" alt="EVOLV" className="pp-logo-img" />
          </button>
          <button
            type="button"
            className="pp-sidebar-close"
            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Main navigation">
          <p className="pp-nav-section-label">MAIN NAV</p>
          <ul className="pp-nav-list">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    className="pp-nav-item"
                    onClick={() => handleNavClick(item.href)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="Community navigation">
          <p className="pp-nav-section-label">COMMUNITY</p>
          <ul className="pp-nav-list">
            {COMMUNITY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    className="pp-nav-item"
                    onClick={() => handleNavClick(item.href)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="Profile navigation">
          <p className="pp-nav-section-label">ACCOUNT</p>
          <ul className="pp-nav-list">
            <li>
              <button
                className="pp-nav-item active"
                onClick={() => handleNavClick('/profile')}
                aria-current="page"
              >
                <User size={20} aria-hidden="true" />
                <span>My Profile</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="pp-sidebar-spacer" />

        <div className="pp-sidebar-footer">
          {user && (
            <div className="pp-sidebar-user">
              {/* Avatar is clickable → profile */}
              <button
                type="button"
                className="pp-sidebar-avatar-btn"
                onClick={() => handleNavClick('/profile')}
                aria-label="View my profile"
                title="View my profile"
              >
                <Avatar src={avatarSrc} name={displayName} size={36} />
              </button>
              <div className="pp-sidebar-user-info">
                <span className="pp-sidebar-user-name">{displayName}</span>
                <span className="pp-sidebar-user-handle">@{handle}</span>
              </div>
              <button
                className="pp-logout-btn"
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

// ─── Right panel ──────────────────────────────────────────────────────────────
function ProfileRightPanel({
  profile,
  skills = { canDo: [], learning: [], curiosity: [] },
  identities = [],
  postCount = 0,
  posts = [],
  isOpen = false,
  onClose = () => { },
}) {
  // ── Compute real stats from the user's own posts ────────────────────────
  // _normalisePost sets these fields from backend reaction data (REST + Socket).
  const postList = Array.isArray(posts) ? posts : [];
  const totalAppreciation = postList.reduce(
    (sum, p) => sum + (Number(p.appreciations) || Number(p.likes) || 0), 0
  );
  const totalLearned = postList.reduce(
    (sum, p) => sum + (Number(p.learnedCount) || 0), 0
  );
  const totalHelpful = postList.reduce(
    (sum, p) => sum + (Number(p.helpfulCount) || 0), 0
  );

  // ── Build Growth items from real skill data ───────────────────────────
  // Topics come from the user's actual learning & canDo skills.
  // Percentages for skill-specific growth need a dedicated API (not yet
  // available). Only the Helpful bar uses a real metric.
  const helpfulPct = Math.min(totalHelpful * 10, 100);
  const canDoSkills = Array.isArray(skills?.canDo) ? skills.canDo : [];
  const learningSkills = Array.isArray(skills?.learning) ? skills.learning : [];
  const growthSkills = [...learningSkills, ...canDoSkills]
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, 3);

  const GROWTH_ITEMS = [
    ...growthSkills.map((label, idx) => ({
      label,
      pct: 0, // No per-skill growth API yet
      colorClass: ['', 'green', 'yellow'][idx % 3],
    })),
    {
      label: 'Helpful',
      pct: helpfulPct,
      colorClass: 'yellow',
    },
  ];

  return (
    <>
      {/* Backdrop for the overview drawer on smaller screens */}
      <div
        className={`pp-right-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`pp-right ${isOpen ? 'open' : ''}`}
        aria-label="Profile details panel"
        aria-modal={isOpen ? true : undefined}
      >
        <button
          type="button"
          className="pp-right-close-btn"
          onClick={onClose}
          aria-label="Close profile overview"
        >
          <X size={20} />
        </button>
        {/* Quick stats — real data from post reactions & post counts */}
        <div className="pp-right-card">
          <p className="pp-right-card-title">Quick Overview</p>
          <div className="pp-quick-stats">
            <div className="pp-quick-stat">
              <span className="pp-quick-stat-value">{postCount}</span>
              <span className="pp-quick-stat-label">Posts</span>
            </div>
            <div className="pp-quick-stat">
              <span className="pp-quick-stat-value">{totalAppreciation}</span>
              <span className="pp-quick-stat-label">Total appreciation</span>
            </div>
            <div className="pp-quick-stat">
              <span className="pp-quick-stat-value">{totalLearned}</span>
              <span className="pp-quick-stat-label">Total learning</span>
            </div>
            <div className="pp-quick-stat">
              <span className="pp-quick-stat-value">{totalHelpful}</span>
              <span className="pp-quick-stat-label">Helpful</span>
            </div>
          </div>
        </div>

        {/* Your Growth — topics from real skills; helpful % from real reactions */}
        <div className="pp-right-card">
          <p className="pp-right-card-title">Your Growth</p>
          <div className="pp-growth-section">
            {GROWTH_ITEMS.length > 0 ? (
              GROWTH_ITEMS.map(({ label, pct, colorClass }) => (
                <div key={label} className="pp-progress-item">
                  <div className="pp-progress-label">
                    <span>{label}</span>
                    <span className="pp-progress-pct">{pct}%</span>
                  </div>
                  <div className="pp-progress-track">
                    <div
                      className={`pp-progress-fill${colorClass ? ' ' + colorClass : ''}`}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label}: ${pct}%`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="pp-growth-note" style={{ marginTop: 0 }}>
                Add skills during onboarding or via Edit Skills to see your growth areas.
              </p>
            )}
            <p className="pp-growth-note">
              * Skill-level % needs a dedicated growth API. Helpful % = real reactions.
            </p>
          </div>
        </div>

        {/* Identities */}
        {identities.length > 0 && (
          <div className="pp-right-card">
            <p className="pp-right-card-title">My Roles</p>
            <div className="pp-identity-list">
              {identities.map((identity) => (
                <div key={identity.id} className="pp-identity-item">
                  <span className="pp-identity-dot" aria-hidden="true" />
                  <span style={{ flex: 1 }}>
                    {identity.identityType?.name || identity.name || 'Role'}
                  </span>
                  {identity.isPrimary && (
                    <span className="pp-identity-primary">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Curious About */}
        {skills.curiosity.length > 0 && (
          <div className="pp-right-card">
            <p className="pp-right-card-title">Curious About</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skills.curiosity.slice(0, 8).map((s) => (
                <span key={s} className="pp-skill-tag curiosity">{s}</span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Content Grid Item ────────────────────────────────────────────────────────

function GridItem({ post }) {
  const isVideo =
    post.media?.type === 'video' || post.type === 'reel';

  const isDocument = post.media?.type === 'document';

  const mediaSrc = post.media?.src || '';
  const hasSrc = Boolean(mediaSrc);

  const fileName =
    post.media?.fileName &&
      post.media.fileName !== 'Document'
      ? post.media.fileName
      : post.caption || 'Document';

  return (
    <article
      className={`pp-grid-item${isDocument ? ' pp-grid-document-item' : ''}`}
      tabIndex={0}
      aria-label={`${isDocument ? 'Document' : isVideo ? 'Short Video' : 'Post'
        }: ${post.caption || 'Untitled'}`}
    >
      {isDocument ? (
        <div className="pp-grid-document-card">
          <div className="pp-grid-document-icon">
            <FileText size={42} aria-hidden="true" />
          </div>

          <h3 className="pp-grid-document-title">
            {post.caption || fileName}
          </h3>

          <p className="pp-grid-document-subtitle">
            Document attachment
          </p>

          {hasSrc ? (
            <a
              className="pp-grid-document-download"
              href={mediaSrc}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${fileName}`}
            >
              <Download size={17} aria-hidden="true" />
              <span>Download Document</span>
            </a>
          ) : (
            <p className="pp-grid-document-unavailable">
              Document URL is unavailable.
            </p>
          )}
        </div>
      ) : hasSrc ? (
        isVideo ? (
          <video
            src={mediaSrc}
            poster={post.media?.poster || ''}
            preload="none"
          />
        ) : (
          <img
            src={mediaSrc}
            alt={post.caption || 'Post image'}
            loading="lazy"
          />
        )
      ) : (
        <div className="pp-grid-placeholder">
          <span className="pp-grid-placeholder-icon">
            {isVideo ? '🎬' : '📝'}
          </span>
          <span style={{ lineHeight: 1.4 }}>
            {post.caption
              ? post.caption.slice(0, 40) +
              (post.caption.length > 40 ? '…' : '')
              : 'No content'}
          </span>
        </div>
      )}

      {isVideo && (
        <>
          <div className="pp-reel-badge" aria-label="Short Video">
            <Play size={8} aria-hidden="true" fill="currentColor" />
            Short Video
          </div>

          {hasSrc && (
            <div className="pp-play-overlay">
              <div className="pp-play-circle">
                <Play size={16} fill="currentColor" aria-hidden="true" />
              </div>
            </div>
          )}
        </>
      )}

      {!isDocument && (
        <div className="pp-grid-item-overlay" aria-hidden="true">
          <p className="pp-grid-item-caption">
            {post.caption || ''}
          </p>

          <div className="pp-grid-item-meta">
            <Heart size={11} aria-hidden="true" />
            <span>{post.appreciations ?? post.likes ?? 0}</span>
            <MessageSquare size={11} aria-hidden="true" />
            <span>{post.comments ?? 0}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function PostDetailModal({ post, onClose, onDiscuss }) {
  const [showCaption, setShowCaption] = useState(true);

  const mediaType = post.media?.type;
  const mediaSrc = post.media?.src || '';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const stats = [
    {
      label: 'Appreciation',
      value: post.appreciations ?? post.likes ?? 0,
      icon: Heart,
    },
    {
      label: 'Learned',
      value: post.learnedCount ?? 0,
      icon: BookOpen,
    },
    {
      label: 'Helpful',
      value: post.helpfulCount ?? 0,
      icon: CheckCircle,
    },
    {
      label: 'Discuss',
      value: post.comments ?? 0,
      icon: MessageCircle,
    },
  ];

  return (
    <div
      className="pp-post-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        className="pp-post-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Post details"
      >
        <button
          type="button"
          className="pp-post-modal-close"
          onClick={onClose}
          aria-label="Close post"
        >
          <X size={22} />
        </button>

        <div className="pp-post-modal-media">
          {mediaType === 'video' ? (
            mediaSrc ? (
              <video src={mediaSrc} controls autoPlay />
            ) : (
              <p>Video unavailable</p>
            )
          ) : mediaType === 'document' ? (
            <div className="pp-post-modal-document">
              <FileText size={64} />
              <h3>{post.caption || 'Document'}</h3>
              {mediaSrc && (
                <a
                  href={mediaSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pp-post-modal-download"
                >
                  <Download size={17} />
                  Download Document
                </a>
              )}
            </div>
          ) : mediaSrc ? (
            <img
              src={mediaSrc}
              alt={post.caption || 'Post'}
            />
          ) : (
            <div className="pp-post-modal-text">
              {post.caption || 'No post content available.'}
            </div>
          )}
        </div>

        <div className="pp-post-modal-details">
          <div className="pp-post-modal-heading">
            <h2>Post details</h2>
            <span>EVOLV Community</span>
          </div>

          <div className="pp-post-modal-caption">
            <p>{post.caption || 'No caption added.'}</p>
          </div>

          <div className="pp-post-modal-stats">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                className="pp-post-modal-stat"
                key={label}
                style={label === 'Discuss' ? { cursor: 'pointer' } : undefined}
                onClick={label === 'Discuss' ? () => { onClose(); onDiscuss?.(post.id); } : undefined}
                role={label === 'Discuss' ? 'button' : undefined}
                tabIndex={label === 'Discuss' ? 0 : undefined}
                onKeyDown={label === 'Discuss'
                  ? (e) => { if (e.key === 'Enter' || e.key === ' ') { onClose(); onDiscuss?.(post.id); } }
                  : undefined}
                aria-label={label === 'Discuss' ? `View ${value} comments` : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="pp-post-modal-caption-toggle"
            onClick={() => setShowCaption((value) => !value)}
          >
            {showCaption ? 'Hide caption' : 'Show caption'}
          </button>

          {showCaption && (
            <div className="pp-post-modal-caption-expanded">
              {post.caption || 'No caption added.'}
            </div>
          )}

          <p className="pp-post-modal-note">
            Opened from your profile posts.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Content Section ──────────────────────────────────────────────────────────
function ContentSection({ posts, onDiscuss }) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);

  // "Reels" renamed to "Short Video" per requirement
  const tabs = [
    { id: 'all', label: 'All Posts', icon: Grid3X3 },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'reels', label: 'Short Video', icon: Video },
    { id: 'articles', label: 'Articles', icon: FileText },
  ];

  const getFiltered = () => {
    switch (activeTab) {
      case 'images': return posts.filter((p) => p.media?.type === 'image');
      case 'reels': return posts.filter((p) => p.media?.type === 'video' || p.type === 'reel');
      case 'articles': return posts.filter((p) => !p.media?.src && p.type !== 'reel');
      default: return posts;
    }
  };

  const getCount = (tabId) => {
    switch (tabId) {
      case 'images': return posts.filter((p) => p.media?.type === 'image').length;
      case 'reels': return posts.filter((p) => p.media?.type === 'video' || p.type === 'reel').length;
      case 'articles': return posts.filter((p) => !p.media?.src && p.type !== 'reel').length;
      default: return posts.length;
    }
  };

  const openPost = (post) => {
    const isVideo = post.media?.type === 'video' || post.type === 'reel';
    if (isVideo && post.media?.src) openReel(post.id);
    else if (post.media?.type === 'image' && post.media?.src) openImage(post.id);
    else setSelectedPost(post);   
  };

  const filtered = getFiltered();

  return (
    <section className="pp-content-card" aria-label="My content">
      <div className="pp-tabs-bar" role="tablist" aria-label="Content filter tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = getCount(tab.id);
          return (
            <button
              key={tab.id}
              id={`pp-tab-${tab.id}`}
              role="tab"
              className={`pp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`pp-tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
              {count > 0 && (
                <span className="pp-tab-count" aria-label={`${count} ${tab.label}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`pp-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`pp-tab-${activeTab}`}
      >
        {filtered.length === 0 ? (
          <div className="pp-empty-state" role="status">
            <span className="pp-empty-icon" aria-hidden="true">
              {activeTab === 'reels'
                ? '🎬'
                : activeTab === 'images'
                  ? '🖼️'
                  : activeTab === 'articles'
                    ? '📰'
                    : '📭'}
            </span>
            <p className="pp-empty-title">
              {posts.length === 0
                ? "You haven't posted anything yet"
                : `No ${activeTab === 'all'
                  ? 'content'
                  : activeTab === 'reels'
                    ? 'short videos'
                    : activeTab
                } yet`}
            </p>
            <p className="pp-empty-sub">
              {posts.length === 0
                ? 'Share your first post, short video, or article from the Home feed to see it here.'
                : 'Switch to another tab to see your other content.'}
            </p>
          </div>
        ) : (
          <div className="pp-grid">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="pp-grid-clickable"
                onClick={() => openPost(post)}
                role="button"
                tabIndex={0}
                aria-label={`Open post: ${post.caption || 'Untitled'}`}
              >
                <GridItem post={post} />
              </div>

            ))}

          </div>

        )}


      </div>
      {/* Instagram-style post detail modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDiscuss={onDiscuss}
        />
      )}
    </section>
  );
}

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', isError: false });

  const showToast = useCallback((message, isError = false) => {
    setToast({ visible: true, message, isError });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2800);
  }, []);

  return { toast, showToast };
}

// ─── Profile Hero ─────────────────────────────────────────────────────────────
function ProfileHero({ profile, user, identities, showToast, onOpenSettings, postCounts }) {
  const displayName = profile?.fullName || user?.name || 'Your Name';
  const username =
    profile?.username || (user?.email || '').split('@')[0] || 'username';
  const bio = profile?.bio || '';
  const avatarSrc = profile?.avatarUrl || '';
  const countryCode = profile?.countryCode || '';

  const countryName = countryCode
    ? new Intl.DisplayNames(['en'], { type: 'region' }).of(
      countryCode.toUpperCase()
    ) || countryCode
    : '';

  const primaryIdentity = identities.find((i) => i.isPrimary) || identities[0];
  const roleName =
    primaryIdentity?.identityType?.name || primaryIdentity?.name || '';

  const handleShare = async () => {
    const url = `${window.location.origin}/#/profile`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${displayName} on EVOLV`, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Profile link copied!');
      }
    } catch {
      // dismissed
    }
  };

  return (
    <div className="pp-hero-card">
      <div className="pp-hero-banner" aria-hidden="true">
        <div className="pp-hero-banner-pattern" />
      </div>

      <div className="pp-hero-body">
        <div className="pp-hero-avatar-row">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="pp-hero-avatar"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="pp-hero-avatar-fallback" aria-label={displayName}>
              {displayName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          <div className="pp-hero-action-row">
            <button
              className="pp-icon-btn"
              onClick={handleShare}
              aria-label="Share profile"
              title="Share profile"
            >
              <Share2 size={16} aria-hidden="true" />
            </button>
            <button
              className="pp-icon-btn"
              onClick={onOpenSettings}
              aria-label="Profile settings"
              title="Settings"
            >
              <Settings size={16} aria-hidden="true" />
            </button>
            <button
              className="pp-edit-btn"
              onClick={() => navigate('/onboarding')}
              aria-label="Edit profile"
            >
              <Edit3 size={14} aria-hidden="true" />
              Edit Profile
            </button>
          </div>
        </div>

        <h1 className="pp-hero-name">{displayName}</h1>
        <p className="pp-hero-username">@{username}</p>

        {(roleName || countryName) && (
          <div className="pp-hero-role-row">
            {roleName && (
              <span className="pp-hero-role-badge">
                <Briefcase size={11} aria-hidden="true" />
                {roleName}
              </span>
            )}
            {countryName && (
              <span className="pp-hero-country">
                <MapPin size={12} aria-hidden="true" />
                {countryName}
              </span>
            )}
          </div>
        )}

        {bio && <p className="pp-hero-bio">{bio}</p>}

        {/* Stats row → "Connections" */}
        <div className="pp-stats-row" role="list" aria-label="Profile statistics">
          <div className="pp-stat" role="listitem">
            <span className="pp-stat-value" aria-live="polite" aria-atomic="true">
              {postCounts != null ? postCounts.totalPosts : '–'}
            </span>
            <span className="pp-stat-label">Posts</span>
          </div>
          <div className="pp-stat" role="listitem">
            <span className="pp-stat-value">0</span>
            <span className="pp-stat-label">Connections</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ─────────────────────────────────────────────────────────
/**
 * Four options: About Us (w/ submenu) | Help | Log Out | Delete Account.
 * Reuses existing authService.logout() and navigate() helpers.
 * No fake API calls — Delete Account shows an informative message.
 */
function SettingsModal({ onClose }) {
  // 'main' | 'about' | 'help' | 'deleteConfirm'
  const [view, setView] = useState('main');
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // ── Shared back arrow ──────────────────────────────────────────────────────
  const BackBtn = ({ onClick }) => (
    <button
      type="button"
      className="pp-settings-back-btn"
      onClick={onClick}
      aria-label="Back to settings menu"
    >
      <ChevronLeft size={16} aria-hidden="true" />
      Back
    </button>
  );

  // ── Sub-views ──────────────────────────────────────────────────────────────
  const AboutUsView = () => (
    <>
      <BackBtn onClick={() => setView('main')} />
      <h3 className="pp-settings-sub-title">About Us</h3>
      <div className="pp-settings-menu">
        <button
          type="button"
          className="pp-settings-item"
          onClick={() => {
            // Open in new tab if a real URL exists; otherwise show placeholder
            const url = window.EVOLV_TERMS_URL || null;
            if (url) { window.open(url, '_blank', 'noopener'); }
            else { setView('termsPlaceholder'); }
          }}
        >
          <span className="pp-settings-item-icon">
            <FileText size={18} aria-hidden="true" />
          </span>
          <span className="pp-settings-item-label">Terms of Use</span>
          <ChevronRight size={14} className="pp-settings-item-arrow" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pp-settings-item"
          onClick={() => {
            const url = window.EVOLV_PRIVACY_URL || null;
            if (url) { window.open(url, '_blank', 'noopener'); }
            else { setView('privacyPlaceholder'); }
          }}
        >
          <span className="pp-settings-item-icon">
            <Shield size={18} aria-hidden="true" />
          </span>
          <span className="pp-settings-item-label">Privacy Policy</span>
          <ChevronRight size={14} className="pp-settings-item-arrow" aria-hidden="true" />
        </button>
      </div>
    </>
  );

  const PlaceholderView = ({ title, icon, message, onBack }) => (
    <>
      <BackBtn onClick={onBack} />
      <div className="pp-settings-placeholder">
        <span className="pp-settings-placeholder-icon">{icon}</span>
        <p className="pp-settings-placeholder-title">{title}</p>
        <p className="pp-settings-placeholder-msg">{message}</p>
      </div>
    </>
  );

  const DeleteConfirmView = () => (
    <>
      <BackBtn onClick={() => setView('main')} />
      <div className="pp-settings-delete-confirm">
        <span className="pp-settings-delete-icon">⚠️</span>
        <p className="pp-settings-delete-title">Delete Account</p>
        <p className="pp-settings-delete-msg">
          Account deletion is a <strong>permanent and irreversible</strong> action.
          All your posts, skills, and progress will be lost.
        </p>
        <div className="pp-settings-delete-notice">
          <AlertCircle size={14} aria-hidden="true" />
          <span>
            This feature requires backend support and is not yet available.
            Please contact <strong>support@evolv.app</strong> to request account deletion.
          </span>
        </div>
        <button
          type="button"
          className="pp-settings-delete-dismiss-btn"
          onClick={() => setView('main')}
        >
          Got it
        </button>
      </div>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderView = () => {
    switch (view) {
      case 'about': return <AboutUsView />;
      case 'help': return (
        <PlaceholderView
          title="Help &amp; Support"
          icon="🛟"
          message="Help documentation is coming soon. For urgent issues, email support@evolv.app."
          onBack={() => setView('main')}
        />
      );
      case 'termsPlaceholder': return (
        <PlaceholderView
          title="Terms of Use"
          icon="📄"
          message="Our Terms of Use page is being prepared. Please check back soon."
          onBack={() => setView('about')}
        />
      );
      case 'privacyPlaceholder': return (
        <PlaceholderView
          title="Privacy Policy"
          icon="🔒"
          message="Our Privacy Policy page is being prepared. Please check back soon."
          onBack={() => setView('about')}
        />
      );
      case 'deleteConfirm': return <DeleteConfirmView />;
      default: return null; // main view rendered below
    }
  };

  const isMain = view === 'main';

  return (
    <div
      className="pp-modal-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="pp-modal pp-settings-modal">
        {/* Header */}
        <div className="pp-modal-header">
          <div>
            <h2 className="pp-modal-title">Settings</h2>
          </div>
          <button
            className="pp-modal-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="pp-settings-body">
          {isMain ? (
            <nav className="pp-settings-menu" aria-label="Settings options">
              {/* About Us */}
              <button
                type="button"
                className="pp-settings-item"
                onClick={() => setView('about')}
              >
                <span className="pp-settings-item-icon">
                  <Info size={18} aria-hidden="true" />
                </span>
                <span className="pp-settings-item-label">About Us</span>
                <ChevronRight size={14} className="pp-settings-item-arrow" aria-hidden="true" />
              </button>

              {/* Help */}
              <button
                type="button"
                className="pp-settings-item"
                onClick={() => setView('help')}
              >
                <span className="pp-settings-item-icon">
                  <HelpCircle size={18} aria-hidden="true" />
                </span>
                <span className="pp-settings-item-label">Help</span>
                <ChevronRight size={14} className="pp-settings-item-arrow" aria-hidden="true" />
              </button>

              <div className="pp-settings-divider" role="separator" />

              {/* Log Out */}
              <button
                type="button"
                className="pp-settings-item"
                onClick={handleLogout}
              >
                <span className="pp-settings-item-icon pp-settings-item-icon--danger">
                  <LogOut size={18} aria-hidden="true" />
                </span>
                <span className="pp-settings-item-label pp-settings-item-label--danger">Log Out</span>
              </button>

              {/* Delete Account */}
              <button
                type="button"
                className="pp-settings-item"
                onClick={() => setView('deleteConfirm')}
              >
                <span className="pp-settings-item-icon pp-settings-item-icon--danger">
                  <Trash2 size={18} aria-hidden="true" />
                </span>
                <span className="pp-settings-item-label pp-settings-item-label--danger">Delete Account</span>
              </button>
            </nav>
          ) : (
            renderView()
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Skills Modal ────────────────────────────────────────────────────────
/**
 * Shows all CURIOSITY_DOMAINS from onboardingData.js.
 * Pre-selects the user's existing skills.
 * Saves via POST /api/skills/user-skills with actual backend IDs.
 */
function EditSkillsModal({ skills, onClose, onSaved }) {
  const allCurrentSkillNames = new Set([
    ...skills.canDo,
    ...skills.learning,
    ...skills.curiosity,
  ]);

  const [selectedNames, setSelectedNames] = useState(() => new Set(allCurrentSkillNames));
  const [expandedDomains, setExpandedDomains] = useState(
    () => new Set(['technology', 'design'])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggleDomain = (domainId) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      next.has(domainId) ? next.delete(domainId) : next.add(domainId);
      return next;
    });
  };

  const toggleSkill = (skillName) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      next.has(skillName) ? next.delete(skillName) : next.add(skillName);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await profileService.applySkillSelection(selectedNames);
      setSuccess(true);
      await onSaved();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error('[EditSkillsModal] Save failed:', err);
      setError("We couldn't save every change. Please try again.");
      await onSaved({ silent: true });
    } finally {
      setSaving(false);
    }
  };

  const uniqueSelected = selectedNames.size;

  return (
    <div
      className="pp-modal-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Edit your skills"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="pp-modal">
        {/* Header */}
        <div className="pp-modal-header">
          <div>
            <h2 className="pp-modal-title">Edit Skills &amp; Interests</h2>
            <p className="pp-modal-subtitle">
              {uniqueSelected} skill{uniqueSelected !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            className="pp-modal-close-btn"
            onClick={onClose}
            aria-label="Close skills editor"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="pp-modal-body">
          {CURIOSITY_DOMAINS.map((domain) => {
            const isExpanded = expandedDomains.has(domain.id);
            const uniqueSkills = [...new Set(domain.skills)];
            const selectedInDomain = uniqueSkills.filter((s) =>
              selectedNames.has(s)
            ).length;

            return (
              <div key={domain.id} className="pp-modal-domain">
                <button
                  type="button"
                  className="pp-modal-domain-header"
                  onClick={() => toggleDomain(domain.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="pp-modal-domain-label">{domain.label}</span>
                  {selectedInDomain > 0 && (
                    <span className="pp-modal-domain-count">
                      {selectedInDomain}
                    </span>
                  )}
                  <span className={`pp-modal-chevron ${isExpanded ? 'open' : ''}`}>
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <div className="pp-modal-skills-grid">
                    {uniqueSkills.map((skillName) => {
                      const isSelected = selectedNames.has(skillName);
                      return (
                        <button
                          key={skillName}
                          type="button"
                          className={`pp-modal-skill-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleSkill(skillName)}
                          aria-pressed={isSelected}
                        >
                          {isSelected && <Check size={11} aria-hidden="true" />}
                          {skillName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pp-modal-footer">
          {error && (
            <div className="pp-modal-error" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="pp-modal-success" role="status">
              <Check size={14} aria-hidden="true" />
              <span>Skills saved successfully!</span>
            </div>
          )}
          <div className="pp-modal-footer-actions">
            <button
              type="button"
              className="pp-modal-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="pp-modal-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader size={14} className="pp-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Save Skills'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skills Card ──────────────────────────────────────────────────────────────
function SkillsCard({ skills, onEditSkills }) {
  const hasAnything =
    skills.canDo.length > 0 ||
    skills.learning.length > 0 ||
    skills.curiosity.length > 0;

  return (
    <section className="pp-skills-card" aria-label="My skills and interests">
      <div className="pp-card-header">
        <h2 className="pp-card-title">Skills &amp; Interests</h2>
        {/* Edit button → opens popup, does NOT navigate away */}
        <button
          className="pp-card-edit-btn"
          onClick={onEditSkills}
          aria-label="Edit skills and interests"
        >
          Edit
        </button>
      </div>

      {!hasAnything ? (
        <p className="pp-skill-empty" role="status">
          No skills added yet.{' '}
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#AA45F5',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
              fontSize: 'inherit',
            }}
            onClick={onEditSkills}
          >
            Add your skills →
          </button>
        </p>
      ) : (
        <>
          {skills.canDo.length > 0 && (
            <div className="pp-skill-group">
              <p className="pp-skill-group-label">
                <CheckCircle
                  size={11}
                  style={{ display: 'inline', marginRight: 4 }}
                  aria-hidden="true"
                />
                Skills I Can Do
              </p>
              <div className="pp-skill-tags">
                {[...new Set(skills.canDo)].map((s) => (
                  <span key={s} className="pp-skill-tag can-do">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skills.learning.length > 0 && (
            <div className="pp-skill-group">
              <p className="pp-skill-group-label">
                <Sparkles
                  size={11}
                  style={{ display: 'inline', marginRight: 4 }}
                  aria-hidden="true"
                />
                Currently Learning
              </p>
              <div className="pp-skill-tags">
                {[...new Set(skills.learning)].map((s) => (
                  <span key={s} className="pp-skill-tag learning">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skills.curiosity.length > 0 && (
            <div className="pp-skill-group">
              <p className="pp-skill-group-label">
                <Target
                  size={11}
                  style={{ display: 'inline', marginRight: 4 }}
                  aria-hidden="true"
                />
                Areas of Interest
              </p>
              <div className="pp-skill-tags">
                {[...new Set(skills.curiosity)].map((s) => (
                  <span key={s} className="pp-skill-tag curiosity">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── ROOT: ProfilePage ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const authUser = authService.getCurrentUser();
  const authUserId =
    authUser?.id ??
    authUser?.userId ??
    authUser?._id ??
    null;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [skills, setSkills] = useState({ canDo: [], learning: [], curiosity: [] });
  const [identities, setIdentities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // Comment panel state
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  /**
   * postCounts — live data from GET /api/posts/my-posts/counts.
   * null = request in flight; object = resolved (totalPosts, imageCount, videoCount, documentCount).
   */
  const [postCounts, setPostCounts] = useState(null);

  const { toast, showToast } = useToast();

  // ── Auth guard ────────────────────────────────────────────────────────────
  // ── Load profile (GET /api/profile) ──
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);

        const p = await getProfile.getProfile();

        if (cancelled) return;

        setProfileData({
          username: p?.username ?? '',
          fullName: p?.fullName ?? p?.name ?? authUser?.name ?? '',
          avatarUrl: p?.avatarUrl ?? p?.avatar ?? '',
          bio: p?.bio ?? p?.bioText ?? '',
          countryCode: p?.countryCode ?? p?.country ?? '',
          ageRange: p?.ageRange ?? '',
        });
      } catch (err) {
        if (cancelled) return;

        console.error('[ProfilePage] Failed to load profile:', err);

        setProfileData({
          username: (authUser?.email || '').split('@')[0],
          fullName: authUser?.name || '',
          avatarUrl: '',
          bio: '',
          countryCode: '',
          ageRange: '',
        });
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    if (authUser) {
      loadProfile();
    } else {
      setProfileLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Load skills ────────────────────────────────────────────────────────────
  const loadSkills = useCallback(async () => {
    let cancelled = false;
    try {
      const [userSkillsRes, curiosityRes, idToNameRes] = await Promise.allSettled([
        profileService.getUserSkills(),
        profileService.getUserCuriosity(),
        profileService.fetchSkillIdToNameMap(),
      ]);

      if (cancelled) return;

      const idToName = idToNameRes.status === 'fulfilled' ? (idToNameRes.value || {}) : {};

      const resolveSkillNames = (record) => {
        if (!record) return [];

        if (typeof record === 'string') {
          const trimmed = record.trim();
          if (!trimmed) return [];
          if (!isNaN(Number(trimmed)) && idToName[Number(trimmed)]) {
            return [idToName[Number(trimmed)]];
          }
          return [trimmed];
        }

        const rawList =
          record.skills ??
          record.skill ??
          record.skillId ??
          record.skillIds ??
          record.userSkills ??
          (record.name ? [record.name] : []);

        const items = Array.isArray(rawList) ? rawList : (rawList != null ? [rawList] : []);
        const names = [];

        for (const item of items) {
          if (item == null) continue;

          if (typeof item === 'string') {
            const trimmed = item.trim();
            if (!trimmed) continue;
            if (!isNaN(Number(trimmed)) && idToName[Number(trimmed)]) {
              names.push(idToName[Number(trimmed)]);
            } else {
              names.push(trimmed);
            }
          } else if (typeof item === 'number') {
            if (idToName[item]) {
              names.push(idToName[item]);
            }
          } else if (typeof item === 'object') {
            const directName = item.name ?? item.skill?.name ?? item.title ?? null;
            if (directName && typeof directName === 'string') {
              names.push(directName.trim());
            } else {
              const id = item.id ?? item.skillId ?? item.skill?.id ?? null;
              if (id != null && idToName[Number(id)]) {
                names.push(idToName[Number(id)]);
              }
            }
          }
        }
        return names;
      };

      const canDo = [];
      const learning = [];

      if (userSkillsRes.status === 'fulfilled') {
        const payload = userSkillsRes.value;
        const records = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.skills)
              ? payload.skills
              : Array.isArray(payload?.userSkills)
                ? payload.userSkills
                : [];

        for (const rec of records) {
          const names = resolveSkillNames(rec);
          const rel = String(rec.relationshipType || rec.type || '').toUpperCase();
          if (rel === 'CAN_DO' || rel === 'CANDO') {
            canDo.push(...names);
          } else if (rel === 'LEARNING' || rel === 'WANT_TO_IMPROVE' || rel === 'WANTTOIMPROVE') {
            learning.push(...names);
          } else {
            canDo.push(...names);
          }
        }
      }

      const curiosity = [];
      if (curiosityRes.status === 'fulfilled') {
        const payload = curiosityRes.value;
        const records = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.skills)
              ? payload.skills
              : [];

        for (const rec of records) {
          const names = resolveSkillNames(rec);
          curiosity.push(...names);
        }
      }

      setSkills({
        canDo: [...new Set(canDo)],
        learning: [...new Set(learning)],
        curiosity: [...new Set(curiosity)],
      });
    } catch (err) {
      if (cancelled) return;
      console.warn('[ProfilePage] Could not load skills:', err.message);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cancel = loadSkills();
    return () => { if (typeof cancel === 'function') cancel(); };
  }, [loadSkills]);

  // ── Load identities ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    profileService
      .getUserIdentities()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setIdentities(list);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[ProfilePage] Could not load identities:', err.message);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Load posts ─────────────────────────────────────────────────────────────
  // getMyPosts uses GET /api/posts/feed + client-side filter by userId.
  // The old getPosts() was GET /api/posts which always returned [] (not implemented).

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);

    try {
      const myPosts = await homePostService.getMyPosts(authUserId);

      // Fetch live reaction counts for the user's posts in parallel to get verified backend counts
      const enrichedPosts = await Promise.all(
        myPosts.map(async (post) => {
          if (!post.id) return post;
          try {
            const reactionData = await homePostService.getReactions(post.id);
            const counts = reactionData?.counts ?? reactionData?.data?.counts ?? {};
            return {
              ...post,
              appreciations:
                typeof counts.APPRECIATE === 'number'
                  ? counts.APPRECIATE
                  : post.appreciations,
              helpfulCount:
                typeof counts.HELPFUL === 'number'
                  ? counts.HELPFUL
                  : post.helpfulCount,
              appreciated:
                reactionData?.myReaction === 'APPRECIATE' || post.appreciated,
              helpful:
                reactionData?.myReaction === 'HELPFUL' || post.helpful,
            };
          } catch {
            return post;
          }
        })
      );

      setPosts(enrichedPosts);
    } catch (err) {
      console.error("[ProfilePage] Failed to load posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [authUserId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // (only one effect needed — loadPosts is stable via useCallback)

  // ── Load post counts (GET /api/posts/my-posts/counts) ─────────────────────
  // Runs once on mount. On error the component stays usable with a 0 fallback.
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    profileService
      .getMyPostCounts()
      .then((counts) => {
        if (cancelled) return;
        setPostCounts(counts);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[ProfilePage] Could not load post counts:', err.message);
        // Fall back to zeros so the UI never crashes
        setPostCounts({ totalPosts: 0, imageCount: 0, videoCount: 0, documentCount: 0 });
      });

    return () => { cancelled = true; };
  }, []);

  // ── Socket.IO for profile page ─────────────────────────────────────────────
  useEffect(() => {
    socketService.connect();

    // Listen for new posts (in case the user just created one on the home feed)
    const offPosts = socketService.onPostsBatch((batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;
      const userId = authUser?.id ?? authUser?.userId ?? authUser?._id;
      if (!userId) return;

      const incoming = batch
        .map(item => homePostService._normalisePost(item?.post ?? item))
        .filter(p => {
          const cid = p.creator?.id ?? p.creator?.userId ?? p.userId;
          return cid != null && String(cid) === String(userId) &&
            p.id && !String(p.id).startsWith('local-');
        });

      if (incoming.length === 0) return;

      setPosts(prev => {
        const existingIds = new Set(prev.map(p => String(p.id)));
        const fresh = incoming.filter(p => !existingIds.has(String(p.id)));
        if (fresh.length === 0) return prev;
        // Refresh post counts after new post arrives
        profileService.getMyPostCounts().then(setPostCounts).catch(() => { });
        return [...fresh, ...prev];
      });
    });

    // Listen for reaction / learned updates on the user's own posts
    const offUpdates = socketService.onPostUpdatesBatch((batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;
      setPosts(prev => {
        let changed = false;
        const next = prev.map(post => {
          const updates = batch.filter(u => String(u.postId) === String(post.id));
          if (updates.length === 0) return post;
          let updated = { ...post };
          updates.forEach(u => {
            if (u.type === 'reaction' && u.counts) {
              if (typeof u.counts.APPRECIATE === 'number') updated.appreciations = u.counts.APPRECIATE;
              if (typeof u.counts.HELPFUL === 'number') updated.helpfulCount = u.counts.HELPFUL;
            } else if (u.type === 'learned' && typeof u.counts?.LEARNED === 'number') {
              updated.learnedCount = u.counts.LEARNED;
            }
          });
          changed = true;
          return updated;
        });
        return changed ? next : prev;
      });
    });

    // Listen for comment count updates on the user's own posts
    const offComments = socketService.onCommentUpdatesBatch((batch) => {
      if (!Array.isArray(batch) || batch.length === 0) return;
      setPosts(prev => {
        let changed = false;
        const next = prev.map(post => {
          const updates = batch.filter(u => String(u.postId) === String(post.id));
          if (updates.length === 0) return post;
          let updatedPost = { ...post };
          updates.forEach(u => {
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
  }, [authUser]);

  // ── Skills modal ────────────────────────────────────────────────────────────
  const handleOpenSkillsModal = useCallback(() => setShowSkillsModal(true), []);
  const handleCloseSkillsModal = useCallback(() => setShowSkillsModal(false), []);

  const handleSkillsSaved = useCallback(
    async ({ silent = false } = {}) => {
      await loadSkills();
      if (!silent) showToast('Skills updated!');
    },
    [loadSkills, showToast]
  );

  // ── Comment panel handlers ──────────────────────────────────────────────────
  const handleDiscuss = useCallback((postId) => {
    setOpenCommentPostId(String(postId));
  }, []);

  const handleCommentCountChange = useCallback((postId, delta) => {
    setPosts(prev => prev.map(p =>
      String(p.id) !== String(postId) ? p
        : { ...p, comments: Math.max(0, (p.comments ?? 0) + delta) }
    ));
  }, []);

  if (!authUser) return null;
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pp-layout" aria-label="EVOLV profile page">
      <ProfileSidebar
        user={authUser}
        profile={profileData}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="pp-main" aria-label="Profile content">
        {/* Topbar */}
        <div className="pp-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="pp-mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <h1 className="pp-topbar-title">My Profile</h1>
          </div>

          <div className="pp-topbar-actions">
            <button
              type="button"
              className="pp-mobile-overview-btn"
              onClick={() => setIsRightPanelOpen(true)}
              aria-label="Open profile overview"
              aria-expanded={isRightPanelOpen}
              title="Quick Overview"
            >
              <BarChart3 size={18} aria-hidden="true" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className="pp-topbar-avatar-btn"
              onClick={() => navigate('/profile')}
              aria-label="My profile"
              title="My profile"
            >
              <Avatar
                src={profileData?.avatarUrl || authUser?.avatar || ''}
                name={profileData?.fullName || authUser?.name || 'You'}
                size={32}
              />
            </button>

            <button className="pp-icon-btn" onClick={() => setShowSettingsModal(true)} aria-label="Profile settings" title="Settings">
              <Settings size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pp-content">
          {profileLoading ? (
            <div>
              <div className="pp-hero-card">
                <div
                  className="pp-skeleton pp-skeleton-hero"
                  style={{ borderRadius: '20px 20px 0 0' }}
                />
                <div style={{ padding: '0 28px 24px' }}>
                  <div
                    style={{
                      marginTop: -44,
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div
                      className="pp-skeleton"
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        border: '4px solid #fff',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div
                        className="pp-skeleton"
                        style={{ width: 80, height: 36, borderRadius: 10 }}
                      />
                      <div
                        className="pp-skeleton"
                        style={{ width: 36, height: 36, borderRadius: 10 }}
                      />
                    </div>
                  </div>
                  <div
                    className="pp-skeleton"
                    style={{ width: 200, height: 24, marginBottom: 8 }}
                  />
                  <div
                    className="pp-skeleton"
                    style={{ width: 120, height: 16, marginBottom: 12 }}
                  />
                  <div
                    className="pp-skeleton"
                    style={{ width: '80%', height: 14, marginBottom: 6 }}
                  />
                  <div
                    className="pp-skeleton"
                    style={{ width: '60%', height: 14 }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <ProfileHero
                profile={profileData}
                user={authUser}
                identities={identities}
                showToast={showToast}
                onOpenSettings={() => setShowSettingsModal(true)}
                postCounts={postCounts}
              />

              <SkillsCard skills={skills} onEditSkills={handleOpenSkillsModal} />

              {postsLoading ? (
                <div className="pp-content-card" aria-busy="true">
                  <div style={{ padding: 20, display: 'flex', gap: 12 }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="pp-skeleton"
                        style={{ flex: 1, aspectRatio: '1', borderRadius: 12 }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <ContentSection posts={posts} onDiscuss={handleDiscuss} />
              )}
            </>
          )}
        </div>
      </main>


      {!profileLoading && (
        <ProfileRightPanel
          profile={profileData}
          skills={skills}
          identities={identities}
          postCount={
            postCounts != null
              ? postCounts.totalPosts
              : posts.length
          }
          posts={posts}
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
        />
      )}


      {showSkillsModal && (
        <EditSkillsModal
          skills={skills}
          onClose={handleCloseSkillsModal}
          onSaved={handleSkillsSaved}
        />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      <div
        className={`pp-toast ${toast.visible ? 'show' : ''}${toast.isError ? ' error' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast.message}
      </div>

      {/* Comment panel — slide-in panel for profile post comments */}
      {openCommentPostId && (
        <CommentPanel
          postId={openCommentPostId}
          currentUser={authUser}
          onClose={() => setOpenCommentPostId(null)}
          onCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
}

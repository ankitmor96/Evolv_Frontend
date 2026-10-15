/**
 * EVOLV — My Profile Page
 *
 * Data sources:
 *   authService.getCurrentUser()           → base user (id, name, email)
 *   profileService.getCompleteProfile()    → GET /api/profile/complete
 *   profileService.getUserSkills()         → GET /api/skills/user-skills
 *   profileService.getUserCuriosity()      → GET /api/skills/curiosity
 *   profileService.getUserIdentities()     → GET /api/user-identities
 *   homePostService.getPosts()             → GET /api/posts (returns [] when not yet implemented)
 *
 * Routing: hash-based (#/profile), consistent with App.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

import { getProfile } from "../../services/getProfile.js";
import { authService } from '../../services/authService.js';
import { profileService } from '../../services/profileService.js';
import { homePostService } from '../../services/homePostService.js';
import './ProfilePage.css';

// ─── Navigation helper ───────────────────────────────────────────────────────
function navigate(path) {
  window.location.hash = path;
  window.dispatchEvent(new Event('navigated'));
}

// ─── Sidebar nav items ───────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: 'home',       label: 'Home',        icon: Home,         href: '/home' },
  { id: 'discover',   label: 'Discover',    icon: Compass,      href: '/discover' },
  { id: 'mylearning', label: 'My Learning', icon: BookOpen,     href: '/learning' },
  { id: 'saved',      label: 'Saved',       icon: Bookmark,     href: '/saved' },
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

// ─── Profile Sidebar (reuses HomePage sidebar patterns) ──────────────────────
function ProfileSidebar({ user, profile, isSidebarOpen, setIsSidebarOpen }) {
  const handleNavClick = (href) => {
    navigate(href);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Backdrop */}
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
        {/* Logo */}
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

        {/* Main Nav */}
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

        {/* Community */}
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

        {/* Profile link — active */}
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

        {/* Footer: user + logout */}
        <div className="pp-sidebar-footer">
          {user && (
            <div className="pp-sidebar-user">
              <Avatar
                src={profile?.avatarUrl || user.avatar}
                name={profile?.fullName || user.name || 'User'}
                size={36}
              />
              <div className="pp-sidebar-user-info">
                <span className="pp-sidebar-user-name">
                  {profile?.fullName || user.name || 'You'}
                </span>
                <span className="pp-sidebar-user-handle">
                  @{profile?.username || (user.email || '').split('@')[0]}
                </span>
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
function ProfileRightPanel({ profile, skills, identities, postCount }) {
  const completenessScore = (() => {
    let score = 0;
    if (profile?.username)   score += 20;
    if (profile?.avatarUrl)  score += 20;
    if (profile?.bio)        score += 15;
    if (profile?.countryCode) score += 10;
    if (skills.canDo.length > 0)     score += 15;
    if (skills.learning.length > 0)  score += 10;
    if (identities.length > 0)       score += 10;
    return Math.min(score, 100);
  })();

  return (
    <aside className="pp-right" aria-label="Profile details panel">
      {/* Quick stats */}
      <div className="pp-right-card">
        <p className="pp-right-card-title">Quick Overview</p>
        <div className="pp-quick-stats">
          <div className="pp-quick-stat">
            <span className="pp-quick-stat-value">{postCount}</span>
            <span className="pp-quick-stat-label">Posts</span>
          </div>
          <div className="pp-quick-stat">
            <span className="pp-quick-stat-value">{skills.canDo.length + skills.learning.length}</span>
            <span className="pp-quick-stat-label">Skills</span>
          </div>
          <div className="pp-quick-stat">
            <span className="pp-quick-stat-value">{skills.curiosity.length}</span>
            <span className="pp-quick-stat-label">Interests</span>
          </div>
          <div className="pp-quick-stat">
            <span className="pp-quick-stat-value">{identities.length}</span>
            <span className="pp-quick-stat-label">Roles</span>
          </div>
        </div>
      </div>

      {/* Profile completeness */}
      <div className="pp-right-card">
        <p className="pp-right-card-title">Profile Completeness</p>
        <div className="pp-completeness">
          <div className="pp-completeness-label">
            <span>Your profile</span>
            <span className="pp-completeness-pct">{completenessScore}%</span>
          </div>
          <div className="pp-completeness-track">
            <div
              className="pp-completeness-fill"
              style={{ width: `${completenessScore}%` }}
              role="progressbar"
              aria-valuenow={completenessScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profile ${completenessScore}% complete`}
            />
          </div>
          {completenessScore < 100 && (
            <p style={{ fontSize: 11, color: '#8b7aa3', margin: 0, lineHeight: 1.5 }}>
              {completenessScore < 50
                ? 'Add skills and a bio to boost your visibility.'
                : 'Almost there! Complete remaining sections.'}
            </p>
          )}
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

      {/* Learning curiosities */}
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
  );
}

// ─── Content Grid Item ────────────────────────────────────────────────────────
function GridItem({ post }) {
  const isVideo = post.media?.type === 'video';
  const mediaSrc = post.media?.src || '';
  const hasSrc = Boolean(mediaSrc);

  return (
    <article
      className="pp-grid-item"
      tabIndex={0}
      aria-label={`${isVideo ? 'Reel' : 'Post'}: ${post.caption || 'Untitled'}`}
      role="button"
    >
      {hasSrc ? (
        isVideo ? (
          <video src={mediaSrc} poster={post.media?.poster || ''} preload="none" />
        ) : (
          <img src={mediaSrc} alt={post.caption || 'Post image'} loading="lazy" />
        )
      ) : (
        <div className="pp-grid-placeholder">
          <span className="pp-grid-placeholder-icon">
            {isVideo ? '🎬' : '📝'}
          </span>
          <span style={{ lineHeight: 1.4 }}>
            {post.caption ? post.caption.slice(0, 40) + (post.caption.length > 40 ? '…' : '') : 'No content'}
          </span>
        </div>
      )}

      {/* Video badge */}
      {isVideo && (
        <>
          <div className="pp-reel-badge" aria-label="Reel">
            <Play size={8} aria-hidden="true" fill="currentColor" />
            Reel
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

      {/* Hover overlay */}
      <div className="pp-grid-item-overlay" aria-hidden="true">
        <p className="pp-grid-item-caption">{post.caption || ''}</p>
        <div className="pp-grid-item-meta">
          <Heart size={11} aria-hidden="true" />
          <span>{post.appreciations ?? post.likes ?? 0}</span>
          <MessageSquare size={11} aria-hidden="true" />
          <span>{post.comments ?? 0}</span>
        </div>
      </div>
    </article>
  );
}

// ─── Content Section ──────────────────────────────────────────────────────────
function ContentSection({ posts }) {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all',     label: 'All Posts', icon: Grid3X3 },
    { id: 'images',  label: 'Images',    icon: ImageIcon },
    { id: 'reels',   label: 'Reels',     icon: Video },
    { id: 'articles',label: 'Articles',  icon: FileText },
  ];

  const getFiltered = () => {
    switch (activeTab) {
      case 'images':   return posts.filter((p) => p.media?.type === 'image');
      case 'reels':    return posts.filter((p) => p.media?.type === 'video' || p.type === 'reel');
      case 'articles': return posts.filter((p) => !p.media?.src && p.type !== 'reel');
      default:         return posts;
    }
  };

  const filtered = getFiltered();

  const getCount = (tabId) => {
    switch (tabId) {
      case 'images':   return posts.filter((p) => p.media?.type === 'image').length;
      case 'reels':    return posts.filter((p) => p.media?.type === 'video' || p.type === 'reel').length;
      case 'articles': return posts.filter((p) => !p.media?.src && p.type !== 'reel').length;
      default:         return posts.length;
    }
  };

  return (
    <section
      className="pp-content-card"
      aria-label="My content"
    >
      {/* Tabs */}
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

      {/* Grid or empty state */}
      <div
        id={`pp-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`pp-tab-${activeTab}`}
      >
        {filtered.length === 0 ? (
          <div className="pp-empty-state" role="status">
            <span className="pp-empty-icon" aria-hidden="true">
              {activeTab === 'reels' ? '🎬' : activeTab === 'images' ? '🖼️' : activeTab === 'articles' ? '📰' : '📭'}
            </span>
            <p className="pp-empty-title">
              {posts.length === 0
                ? "You haven't posted anything yet"
                : `No ${activeTab === 'all' ? 'content' : activeTab} yet`}
            </p>
            <p className="pp-empty-sub">
              {posts.length === 0
                ? 'Share your first post, reel, or article from the Home feed to see it here.'
                : `Switch to another tab to see your other content.`}
            </p>
          </div>
        ) : (
          <div className="pp-grid">
            {filtered.map((post) => (
              <GridItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2800);
  }, []);

  return { toast, showToast };
}

// ─── Profile Hero ─────────────────────────────────────────────────────────────
function ProfileHero({ profile, user, identities, showToast }) {
  const displayName = profile?.fullName || user?.name || 'Your Name';
  const username = profile?.username || (user?.email || '').split('@')[0] || 'username';
  const bio = profile?.bio || '';
  const avatarSrc = profile?.avatarUrl || '';
  const countryCode = profile?.countryCode || '';

  // Map country code to a readable name (simple lookup)
  const countryName = countryCode
    ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode.toUpperCase()) || countryCode
    : '';

  // Primary identity (role)
  const primaryIdentity = identities.find((i) => i.isPrimary) || identities[0];
  const roleName = primaryIdentity?.identityType?.name || primaryIdentity?.name || '';

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
      {/* Banner */}
      <div className="pp-hero-banner" aria-hidden="true">
        <div className="pp-hero-banner-pattern" />
      </div>

      {/* Body */}
      <div className="pp-hero-body">
        {/* Avatar row */}
        <div className="pp-hero-avatar-row">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="pp-hero-avatar"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div
              className="pp-hero-avatar-fallback"
              aria-label={displayName}
            >
              {displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Actions */}
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
              onClick={() => navigate('/onboarding')}
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

        {/* Name */}
        <h1 className="pp-hero-name">{displayName}</h1>
        <p className="pp-hero-username">@{username}</p>

        {/* Role + country */}
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

        {/* Bio */}
        {bio && (
          <p className="pp-hero-bio">{bio}</p>
        )}

        {/* Stats */}
        <div className="pp-stats-row" role="list" aria-label="Profile statistics">
          <div className="pp-stat" role="listitem">
            <span className="pp-stat-value">—</span>
            <span className="pp-stat-label">Posts</span>
          </div>
          <div className="pp-stat" role="listitem">
            <span className="pp-stat-value">—</span>
            <span className="pp-stat-label">Followers</span>
          </div>
          <div className="pp-stat" role="listitem">
            <span className="pp-stat-value">—</span>
            <span className="pp-stat-label">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skills Card ──────────────────────────────────────────────────────────────
function SkillsCard({ skills }) {
  const hasAnything =
    skills.canDo.length > 0 ||
    skills.learning.length > 0 ||
    skills.curiosity.length > 0;

  return (
    <section className="pp-skills-card" aria-label="My skills and interests">
      <div className="pp-card-header">
        <h2 className="pp-card-title">Skills & Interests</h2>
        <button
          className="pp-card-edit-btn"
          onClick={() => navigate('/onboarding')}
          aria-label="Edit skills and interests"
        >
          Edit
        </button>
      </div>

      {!hasAnything ? (
        <p className="pp-skill-empty">
          No skills added yet.{' '}
          <button
            style={{ background: 'none', border: 'none', color: '#AA45F5', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 'inherit' }}
            onClick={() => navigate('/onboarding')}
          >
            Add your skills →
          </button>
        </p>
      ) : (
        <>
          {skills.canDo.length > 0 && (
            <div className="pp-skill-group">
              <p className="pp-skill-group-label">
                <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} aria-hidden="true" />
                Skills I Can Do
              </p>
              <div className="pp-skill-tags">
                {skills.canDo.map((s) => (
                  <span key={s} className="pp-skill-tag can-do">{s}</span>
                ))}
              </div>
            </div>
          )}

          {skills.learning.length > 0 && (
            <div className="pp-skill-group">
              <p className="pp-skill-group-label">
                <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} aria-hidden="true" />
                Currently Learning
              </p>
              <div className="pp-skill-tags">
                {skills.learning.map((s) => (
                  <span key={s} className="pp-skill-tag learning">{s}</span>
                ))}
              </div>
            </div>
          )}

          {skills.curiosity.length > 0 && (
            <div className="pp-skill-group">
              <p className="pp-skill-group-label">
                <Target size={11} style={{ display: 'inline', marginRight: 4 }} aria-hidden="true" />
                Areas of Interest
              </p>
              <div className="pp-skill-tags">
                {skills.curiosity.map((s) => (
                  <span key={s} className="pp-skill-tag curiosity">{s}</span>
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

  // ── State ────────────────────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData]       = useState(null);
  const [skills, setSkills]                 = useState({ canDo: [], learning: [], curiosity: [] });
  const [identities, setIdentities]         = useState([]);
  const [posts, setPosts]                   = useState([]);
  const [postsLoading, setPostsLoading]     = useState(true);

  const { toast, showToast } = useToast();

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) {
      navigate('/login');
    }
  }, [authUser]);

  if (!authUser) return null;

  // ── Fetch complete profile ───────────────────────────────────────────────
 
  // Fetch profile using GET /api/profile
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
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);


  // ── Fetch skills ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadSkills = async () => {
      try {
        const [userSkillsRes, curiosityRes] = await Promise.allSettled([
          profileService.getUserSkills(),
          profileService.getUserCuriosity(),
        ]);

        if (cancelled) return;

        // User skills: CAN_DO / LEARNING / WANT_TO_IMPROVE
        const canDo    = [];
        const learning = [];

        if (userSkillsRes.status === 'fulfilled') {
          const records = Array.isArray(userSkillsRes.value)
            ? userSkillsRes.value
            : Array.isArray(userSkillsRes.value?.data)
            ? userSkillsRes.value.data
            : [];

          for (const rec of records) {
            const names = Array.isArray(rec.skills)
              ? rec.skills.map((s) => s.name || s).filter(Boolean)
              : [];
            if (rec.relationshipType === 'CAN_DO')          canDo.push(...names);
            else if (rec.relationshipType === 'LEARNING')    learning.push(...names);
            else if (rec.relationshipType === 'WANT_TO_IMPROVE') learning.push(...names);
          }
        }

        // Curiosity skills
        const curiosity = [];

        if (curiosityRes.status === 'fulfilled') {
          const raw = curiosityRes.value;
          const records = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.data)
            ? raw.data
            : [];

          for (const rec of records) {
            const names = Array.isArray(rec.skills)
              ? rec.skills.map((s) => s.name || s).filter(Boolean)
              : Array.isArray(rec.skillNames)
              ? rec.skillNames
              : rec.skill?.name
              ? [rec.skill.name]
              : [];
            curiosity.push(...names);
          }
        }

        setSkills({ canDo, learning, curiosity: [...new Set(curiosity)] });
      } catch (err) {
        if (cancelled) return;
        console.warn('[ProfilePage] Could not load skills:', err.message);
      }
    };

    loadSkills();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch identities ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    profileService.getUserIdentities()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setIdentities(list);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[ProfilePage] Could not load identities:', err.message);
      });

    return () => { cancelled = true; };
  }, []);

  // ── Fetch posts ──────────────────────────────────────────────────────────
  // GET /api/posts currently returns 404. homePostService.getPosts() returns []
  // on failure. We filter to only show posts by the current user (by userId/authorId).
  useEffect(() => {
    let cancelled = false;

    homePostService.getPosts()
      .then((allPosts) => {
        if (cancelled) return;

        // Filter to only the authenticated user's posts when IDs are available
        const userId = authUser?.id ? String(authUser.id) : null;

        const myPosts = userId
          ? allPosts.filter((p) => {
              const authorId =
                String(p.creator?.userId ?? p.creator?.id ?? p.user?.id ?? p.userId ?? '');
              return authorId === userId;
            })
          : []; // If we can't verify authorship, show nothing — never show other users' posts

        setPosts(myPosts);
      })
      .catch(() => {
        if (cancelled) return;
        setPosts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setPostsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="pp-layout" aria-label="EVOLV profile page">
      {/* Left sidebar */}
      <ProfileSidebar
        user={authUser}
        profile={profileData}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main column */}
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
              className="pp-icon-btn"
              onClick={() => navigate('/onboarding')}
              aria-label="Profile settings"
              title="Settings"
            >
              <Settings size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="pp-content">
          {profileLoading ? (
            /* Skeleton loading state */
            <div>
              <div className="pp-hero-card">
                <div className="pp-skeleton pp-skeleton-hero" style={{ borderRadius: '20px 20px 0 0' }} />
                <div style={{ padding: '0 28px 24px' }}>
                  <div style={{ marginTop: -44, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="pp-skeleton" style={{ width: 90, height: 90, borderRadius: '50%', border: '4px solid #fff' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="pp-skeleton" style={{ width: 80, height: 36, borderRadius: 10 }} />
                      <div className="pp-skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
                    </div>
                  </div>
                  <div className="pp-skeleton" style={{ width: 200, height: 24, marginBottom: 8 }} />
                  <div className="pp-skeleton" style={{ width: 120, height: 16, marginBottom: 12 }} />
                  <div className="pp-skeleton" style={{ width: '80%', height: 14, marginBottom: 6 }} />
                  <div className="pp-skeleton" style={{ width: '60%', height: 14 }} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Hero / Profile header */}
              <ProfileHero
                profile={profileData}
                user={authUser}
                identities={identities}
                showToast={showToast}
              />

              {/* Skills + interests */}
              <SkillsCard skills={skills} />

              {/* My content */}
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
                <ContentSection posts={posts} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Right panel */}
      {!profileLoading && (
        <ProfileRightPanel
          profile={profileData}
          skills={skills}
          identities={identities}
          postCount={posts.length}
        />
      )}

      {/* Toast */}
      <div
        className={`pp-toast ${toast.visible ? 'show' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast.message}
      </div>
    </div>
  );
}

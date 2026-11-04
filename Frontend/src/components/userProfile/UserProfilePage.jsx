import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Grid3x3, Film, FileText } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import { connectionService } from '../../services/connectionService.js';
import { userProfileService } from '../../services/userProfileService.js';
import './Userprofilepage.css';
import { navigate as go } from '../../utils/navigate.js';

function getUserIdFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] === 'profile' ? parts[1] : null;
}

function Avatar({ src, name, size = 90 }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return err || !src ? (
    <div className="up-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</div>
  ) : (
    <img className="up-avatar" src={src} alt={name} style={{ width: size, height: size }} onError={() => setErr(true)} />
  );
}

const CONNECT_LABEL = { none: '+ Connect', pending: 'Requested', incoming: 'Accept', connected: 'Connected' };

export default function UserProfilePage() {
  const authUser = authService.getCurrentUser();
  const me = authUser?.id ?? authUser?.userId ?? authUser?._id ?? null;

  const [userId, setUserId] = useState(getUserIdFromPath());
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('none');
  const [connectionId, setConnectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('posts');
  const busy = useRef(false);

  // Re-read id if hash changes while this page is mounted
  useEffect(() => {
    const sync = () => setUserId(getUserIdFromPath());
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
    };
  }, []);

  // Viewing yourself -> go to your own profile page
  useEffect(() => {
    if (userId && me != null && String(userId) === String(me)) go('/profile');
  }, [userId, me]);

  // Load profile + posts + connection status
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const [profRes, feed, map, connCount] = await Promise.all([
          userProfileService.getUserProfile(userId).catch(() => null),
          homePostService.getFeedPosts().catch(() => ({ posts: [] })),
          connectionService.getConnectionMap(me).catch(() => new Map()),
          userProfileService.getConnectionsCount(userId).catch(() => null),
        ]);
        if (cancelled) return;

        const userPosts = (feed.posts || [])
          .map((p) => homePostService._normalisePost(p))
          .filter((p) => String(p.creator?.id) === String(userId));

        const c = userPosts[0]?.creator;
        const base =
          profRes ??
          (c
            ? {
              id: c.id,
              name: c.name || c.username || 'User',
              username: c.username || '',
              avatar: c.avatar || '',
              bio: '',
              field: c.field || 'Community Member',
              connectionsCount: null,
              skills: null,
            }
            : null);

        if (!base) throw new Error('User profile not found');

        const prof = {
          ...base,
          connectionsCount: connCount ?? base.connectionsCount ?? null,
        };
        const conn = map.get(String(userId));
        setProfile(prof);
        setPosts(userPosts);
        setStatus(conn?.status ?? 'none');
        setConnectionId(conn?.connectionId ?? null);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, me]);

  const handleConnect = async () => {
    if (busy.current) return;
    busy.current = true;
    const resync = async () => {
      const map = await connectionService.getConnectionMap(me);
      const c = map.get(String(userId));
      setStatus(c?.status ?? 'none');
      setConnectionId(c?.connectionId ?? null);
    };
    try {
      if (status === 'none') {
        setStatus('pending');
        try { await connectionService.sendConnectionRequest(userId); }
        catch (err) { if (err.status !== 409) throw err; }
        await resync();
      } else if (status === 'incoming') {
        let id = connectionId;
        if (id == null) id = (await connectionService.getConnectionMap(me)).get(String(userId))?.connectionId;
        setStatus('connected');
        await connectionService.acceptConnectionRequest(id);
      } else {
        if (status === 'connected' && !window.confirm('Remove this connection?')) return;
        let id = connectionId;
        if (id == null) id = (await connectionService.getConnectionMap(me)).get(String(userId))?.connectionId;
        setStatus('none');
        setConnectionId(null);
        await connectionService.removeConnection(id);
      }
    } catch (err) {
      console.warn('[UserProfile] connection action failed:', err.message);
      await resync().catch(() => { });
    } finally {
      busy.current = false;
    }
  };

  const openPost = (post) => {
    const type = post.media?.type;

    if (type === 'document' && post.media?.src) {
      sessionStorage.setItem('evolv-doc-start', String(post.id));
      sessionStorage.setItem('evolv-doc-back', `/profile/${userId}`);
      sessionStorage.setItem('evolv-doc-owner', String(userId));
      go('/document');
      return;
    }

    const isVideo = type === 'video';
    if (!isVideo && type !== 'image') return;
    sessionStorage.setItem(isVideo ? 'evolv-reel-start' : 'evolv-image-start', String(post.id));
    sessionStorage.setItem(isVideo ? 'evolv-reel-back' : 'evolv-image-back', `/profile/${userId}`);
    go(isVideo ? '/reels' : '/image');
  };

  const goBack = () => (window.history.length > 1 ? window.history.back() : go('/home'));

  const shownPosts =
    tab === 'reels' ? posts.filter((p) => p.media?.type === 'video') : posts;

  return (
    <div className="up-page">
      <header className="up-header">
        <button type="button" className="up-back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="up-header-title">{profile?.username ? `@${profile.username}` : 'Profile'}</h1>
      </header>

      <main className="up-body">
        {loading && <p className="up-note">Loading profile...</p>}
        {!loading && error && <p className="up-note up-error">{error}</p>}

        {!loading && !error && profile && (
          <>
            {/* Top: avatar + stats */}
            <section className="up-top">
              <Avatar src={profile.avatar} name={profile.name} size={90} />
              <div className="up-stats">
                <div><strong>{posts.length}</strong><span>Posts</span></div>
                <div><strong>{profile.connectionsCount ?? 0}</strong><span>Connections</span></div>
                <div><strong>{profile.skills ? profile.skills.length : '0'}</strong><span>Skills</span></div>
              </div>
            </section>

            {/* Name / bio */}
            <section className="up-info">
              <h2 className="up-name">{profile.name}</h2>
              <p className="up-field">{profile.field}</p>
              {profile.bio && <p className="up-bio">{profile.bio}</p>}
            </section>

            {/* Actions */}
            <section className="up-actions">
              <button
                type="button"
                className={`up-btn ${status === 'none' || status === 'incoming' ? 'primary' : ''}`}
                onClick={handleConnect}
              >
                {CONNECT_LABEL[status]}
              </button>
              <button type="button" className="up-btn" onClick={() => go('/messages')}>
                Message
              </button>
            </section>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <section className="up-skills">
                {profile.skills.map((s) => <span key={s} className="up-skill">{s}</span>)}
              </section>
            )}

            {/* Tabs */}
            <nav className="up-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
                <Grid3x3 size={20} />
              </button>
              <button role="tab" aria-selected={tab === 'reels'} className={tab === 'reels' ? 'active' : ''} onClick={() => setTab('reels')}>
                <Film size={20} />
              </button>
            </nav>

            {/* Grid */}
            <div className="up-grid">
              {shownPosts.map((p) => (
                <button key={p.id} type="button" className="up-tile" onClick={() => openPost(p)}>
                  {p.media?.type === 'video' ? (
                    <>
                      <video src={p.media.src} poster={p.media.poster} muted playsInline preload="metadata" />
                      <span className="up-tile-badge"><Play size={12} fill="currentColor" /></span>
                    </>
                  ) : p.media?.type === 'image' && p.media.src ? (
                    <img src={p.media.src} alt="" loading="lazy" />
                  ) : p.media?.type === 'document' ? (
                    <div className="up-tile-doc">
                      <FileText size={26} />
                      <span
                        className="up-tile-doc-view"
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: "#aa45f5",
                          color: "#fff",
                        }}
                      >
                        View
                      </span>
                    </div>
                  ) : (
                    <div className="up-tile-text">
                      <FileText size={18} />
                      <span>{p.caption || 'Post'}</span>
                    </div>
                  )}
                </button>
              ))}
              {shownPosts.length === 0 && <p className="up-note">No posts yet.</p>}
            </div>
          </>
        )}
      </main>
    </div >
  );
}

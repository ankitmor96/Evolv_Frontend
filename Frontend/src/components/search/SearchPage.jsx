import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, X, Play } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import { connectionService } from '../../services/connectionService.js';
import { userSearchService } from '../../services/userSearchService.js';
import { navigate as go } from '../../utils/navigate.js';
import './SearchPage.css';

function Avatar({ src, name, size = 44 }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return err || !src ? (
    <div className="sp-avatar-fallback" style={{ width: size, height: size }}>{initials}</div>
  ) : (
    <img className="sp-avatar" src={src} alt={name} style={{ width: size, height: size }} onError={() => setErr(true)} />
  );
}

const CONNECT_LABEL = {
  none: '+ Connect',
  pending: 'Requested',
  incoming: 'Accept',
  connected: 'Connected',
};

export default function SearchPage() {
  const me = (() => {
    const u = authService.getCurrentUser();
    return u?.id ?? u?.userId ?? u?._id ?? null;
  })();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [explore, setExplore] = useState([]);
  const [connMap, setConnMap] = useState(new Map());
  const pending = useRef(new Set());
  const inputRef = useRef(null);

  // Load explore grid + my connections once
  useEffect(() => {
    inputRef.current?.focus();
    let cancelled = false;
    (async () => {
      const [feed, map] = await Promise.all([
        homePostService.getFeedPosts(),
        connectionService.getConnectionMap(me).catch(() => new Map()),
      ]);
      if (cancelled) return;
      const tiles = (feed.posts || [])
        .map((p) => homePostService._normalisePost(p))
        .filter((p) => p.media?.src && (p.media.type === 'image' || p.media.type === 'video'));
      setExplore(tiles);
      setConnMap(map);
    })();
    return () => { cancelled = true; };
  }, [me]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setError(''); setSearching(false); return; }

    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const users = await userSearchService.searchUsers(q);
        setResults(users.filter((u) => String(u.id) !== String(me)));
        setError('');
      } catch (e) {
        setError(e.message || 'Search failed');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, me]);

  const statusOf = (userId) => connMap.get(String(userId))?.status ?? 'none';

  const patch = (userId, value) =>
    setConnMap((prev) => {
      const next = new Map(prev);
      if (value) next.set(String(userId), value); else next.delete(String(userId));
      return next;
    });

  const handleConnect = async (userId) => {
    const key = String(userId);
    if (pending.current.has(key)) return;
    pending.current.add(key);

    const entry = connMap.get(key);
    const status = entry?.status ?? 'none';
    const resync = async () => setConnMap(await connectionService.getConnectionMap(me));

    try {
      if (status === 'none') {
        patch(userId, { status: 'pending', connectionId: null });
        try {
          await connectionService.sendConnectionRequest(userId);
        } catch (err) {
          if (err.status !== 409) throw err;
        }
        await resync();
      } else if (status === 'incoming') {
        let id = entry?.connectionId;
        if (id == null) id = (await connectionService.getConnectionMap(me)).get(key)?.connectionId;
        patch(userId, { status: 'connected', connectionId: id });
        await connectionService.acceptConnectionRequest(id);
      } else {
        if (status === 'connected' && !window.confirm('Remove this connection?')) return;
        let id = entry?.connectionId;
        if (id == null) id = (await connectionService.getConnectionMap(me)).get(key)?.connectionId;
        patch(userId, null);
        await connectionService.removeConnection(id);
      }
    } catch (err) {
      console.warn('[SearchPage] connection action failed:', err.message);
      await resync().catch(() => {});
    } finally {
      pending.current.delete(key);
    }
  };

  const openTile = (post) => {
    const isVideo = post.media.type === 'video';
    sessionStorage.setItem(isVideo ? 'evolv-reel-start' : 'evolv-image-start', String(post.id));
    sessionStorage.setItem(isVideo ? 'evolv-reel-back' : 'evolv-image-back', '/search');
    go(isVideo ? '/reels' : '/image');
  };

  const showResults = query.trim().length > 0;

  return (
    <div className="sp-page">
      <header className="sp-header">
        <button type="button" className="sp-back" onClick={() => go('/home')} aria-label="Back to home">
          <ArrowLeft size={22} />
        </button>
        <div className="sp-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search people"
          />
          {query && (
            <button type="button" className="sp-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <main className="sp-body">
        {showResults ? (
          <>
            {searching && <p className="sp-note">Searching...</p>}
            {error && <p className="sp-note sp-error">{error}</p>}
            {!searching && !error && results.length === 0 && (
              <p className="sp-note">No people found for "{query.trim()}".</p>
            )}

            <ul className="sp-list">
              {results.map((u) => {
                const status = statusOf(u.id);
                return (
                  <li key={u.id} className="sp-row">
                    <button type="button" className="sp-row-main" onClick={() => go(`/profile/${u.id}`)}>
                      <Avatar src={u.avatar} name={u.name} />
                      <span className="sp-row-info">
                        <span className="sp-row-name">{u.name || u.username}</span>
                        <span className="sp-row-sub">@{u.username} · {u.field}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`sp-connect ${status === 'connected' || status === 'pending' ? 'on' : ''}`}
                      onClick={() => handleConnect(u.id)}
                    >
                      {CONNECT_LABEL[status]}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="sp-grid">
            {/* {explore.map((p) => (
              <button key={p.id} type="button" className="sp-tile" onClick={() => openTile(p)}>
                {p.media.type === 'video' ? (
                  <>
                    <video src={p.media.src} poster={p.media.poster} muted playsInline preload="metadata" />
                    <span className="sp-tile-badge"><Play size={12} fill="currentColor" /></span>
                  </>
                ) : (
                  <img src={p.media.src} alt="" loading="lazy" />
                )}
              </button>
            ))}
            {explore.length === 0 && <p className="sp-note">Nothing to explore yet.</p>} */}
          </div>
        )}
      </main>
    </div>
  );
}
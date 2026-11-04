import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Heart, Sparkles, CheckCircle2,
  MessageCircle, Trash2, ZoomIn, ZoomOut,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import { navigate } from '../../utils/navigate.js';
import CommentPanel from '../shared/CommentPanel.jsx';

const fmt = (n = 0) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n));
const isViewable = (p) => ['image', 'video'].includes(p?.media?.type) && p?.media?.src;

const REACTION_FIELDS = {
  APPRECIATE: { flag: 'appreciated', count: 'appreciations' },
  HELPFUL: { flag: 'helpful', count: 'helpfulCount' },
};

export default function MyPostFullScreenPage() {
  const user = authService.getCurrentUser();
  const userId = user?.id ?? user?.userId ?? user?._id ?? null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const pending = useRef(new Set());
  const postsRef = useRef([]);
  const touchX = useRef(null);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  const visible = filter === 'all' ? posts : posts.filter((p) => p.media.type === filter);
  const post = visible[index];

  // Back to the feed, scrolled to the post you were viewing
  const close = useCallback((postId, currentFilter) => {
    if (postId != null) {
      sessionStorage.setItem('evolv-myposts-start', String(postId));
      sessionStorage.setItem('evolv-myposts-filter', currentFilter || 'all');
    }
    sessionStorage.setItem('evolv-myposts-back', '/profile');
    navigate('/my-posts');
    window.dispatchEvent(new Event('navigated'));
  }, []);

  // ── Load ONLY the logged-in user's posts ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mine = await homePostService.getMyPosts(userId).catch(() => []);
        const list = (mine || []).filter(isViewable);

        const enriched = await Promise.all(
          list.map(async (p) => {
            try {
              const r = await homePostService.getReactions(p.id);
              const c = r?.counts ?? {};
              return {
                ...p,
                appreciations: typeof c.APPRECIATE === 'number' ? c.APPRECIATE : p.appreciations,
                helpfulCount: typeof c.HELPFUL === 'number' ? c.HELPFUL : p.helpfulCount,
                appreciated: r?.myReaction === 'APPRECIATE' || p.appreciated,
                helpful: r?.myReaction === 'HELPFUL' || p.helpful,
              };
            } catch {
              return p;
            }
          })
        );
        if (cancelled) return;

        const startFilter = sessionStorage.getItem('evolv-fs-filter') || 'all';
        const startId = sessionStorage.getItem('evolv-fs-start');
        sessionStorage.removeItem('evolv-fs-filter');
        sessionStorage.removeItem('evolv-fs-start');

        const base = ['image', 'video'].includes(startFilter)
          ? enriched.filter((p) => p.media.type === startFilter)
          : enriched;
        const f = ['image', 'video'].includes(startFilter) ? startFilter : 'all';

        setPosts(enriched);
        setFilter(f);
        const i = base.findIndex((p) => String(p.id) === startId);
        setIndex(i >= 0 ? i : 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((dir) => {
    setZoomed(false);
    setIndex((i) => Math.min(Math.max(i + dir, 0), Math.max(visible.length - 1, 0)));
  }, [visible.length]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (commentPostId) return;
      if (e.key === 'Escape') {
        if (confirmOpen) setConfirmOpen(false);
        else close(post?.id, filter);
      }
      if (confirmOpen) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, commentPostId, confirmOpen, close, post, filter]);

  // Swipe on phones
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null || zoomed) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  };

  const toggleReaction = useCallback(async (postId, type) => {
    const key = `reaction:${postId}:${type}`;
    if (pending.current.has(key)) return;
    pending.current.add(key);

    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) { pending.current.delete(key); return; }

    const mine = REACTION_FIELDS[type];
    const was = Boolean(current[mine.flag]);
    const next = !was;

    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : {
        ...p,
        [mine.flag]: next,
        [mine.count]: Math.max(0, (p[mine.count] ?? 0) + (next ? 1 : -1)),
      }));

    try {
      if (was) await homePostService.removeReaction(postId, type);
      else await homePostService.addReaction(postId, type);
    } catch (err) {
      if (!(was && err.status === 404)) setPosts(snapshot);
    } finally {
      pending.current.delete(key);
    }
  }, []);

  const toggleLearned = useCallback(async (postId) => {
    const key = `learned:${postId}`;
    if (pending.current.has(key)) return;
    pending.current.add(key);

    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) { pending.current.delete(key); return; }

    const was = Boolean(current.learned);
    const next = !was;

    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : {
        ...p,
        learned: next,
        learnedCount: Math.max(0, (p.learnedCount ?? 0) + (next ? 1 : -1)),
      }));

    try {
      if (was) await homePostService.unmarkLearned(postId);
      else await homePostService.markLearned(postId);
    } catch (err) {
      if (!(was && err.status === 404)) setPosts(snapshot);
    } finally {
      pending.current.delete(key);
    }
  }, []);

  const onCommentCount = useCallback((postId, delta) => {
    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p
        : { ...p, comments: Math.max(0, (p.comments ?? 0) + delta) }));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!post || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await homePostService.deletePost(post.id);
      const remaining = postsRef.current.filter((p) => String(p.id) !== String(post.id));
      setPosts(remaining);
      setConfirmOpen(false);
      setZoomed(false);

      const stillVisible = filter === 'all'
        ? remaining
        : remaining.filter((p) => p.media.type === filter);

      if (stillVisible.length === 0) close(null);
      else setIndex((i) => Math.min(i, stillVisible.length - 1));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [post, deleting, filter, close]);

  if (!user) return null;

  return (
    <div className="fs-page">
      <style>{`
        .fs-page { position:fixed; inset:0; z-index:60; background:#000; color:#fff;
          display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .fs-top { position:absolute; top:0; left:0; right:0; z-index:5; display:flex; align-items:center;
          justify-content:space-between; padding:14px 16px;
          background:linear-gradient(180deg,rgba(0,0,0,.65),transparent); }
        .fs-round { width:42px; height:42px; border-radius:50%; border:none; background:rgba(255,255,255,.16);
          color:#fff; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;
          backdrop-filter:blur(6px); }
        .fs-round:hover { background:rgba(255,255,255,.28); }
        .fs-top-right { display:flex; gap:10px; align-items:center; }
        .fs-count { font-size:13px; font-weight:600; background:rgba(255,255,255,.16); padding:6px 12px; border-radius:999px; }

        .fs-stage { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
        .fs-scroll { width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .fs-scroll.zoomed { overflow:auto; align-items:flex-start; justify-content:flex-start; }
        .fs-img { max-width:100%; max-height:100%; object-fit:contain; cursor:zoom-in; user-select:none; }
        .fs-img.zoomed { max-width:none; max-height:none; width:180%; cursor:zoom-out; }
        .fs-video { width:100%; height:100%; object-fit:contain; background:#000; }

        .fs-nav { position:absolute; top:50%; transform:translateY(-50%); z-index:5; width:46px; height:46px;
          border-radius:50%; border:none; background:rgba(255,255,255,.16); color:#fff; cursor:pointer;
          display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); }
        .fs-nav:hover { background:rgba(255,255,255,.3); }
        .fs-nav.left { left:16px; } .fs-nav.right { right:16px; }

        .fs-bottom { position:absolute; left:0; right:0; bottom:0; z-index:5; padding:60px 18px 20px;
          background:linear-gradient(0deg,rgba(0,0,0,.8),transparent); pointer-events:none; }
        .fs-bottom > * { pointer-events:auto; }
        .fs-caption { max-width:640px; margin:0 auto 12px; font-size:14px; line-height:1.5; word-break:break-word; }
        .fs-actions { max-width:640px; margin:0 auto; display:flex; gap:22px; }
        .fs-act { display:inline-flex; align-items:center; gap:7px; border:none; background:transparent;
          color:#fff; font-size:14px; font-weight:600; cursor:pointer; padding:4px 0; }
        .fs-act:active { transform:scale(.9); }
        .fs-act.on-pink { color:#ff6b8b; } .fs-act.on-blue { color:#8c8dff; } .fs-act.on-green { color:#4ade80; }
        .fs-video-lift { padding-bottom:70px; } /* keep video controls clear of the overlay */

        .fs-msg { color:#cfc8e0; font-size:15px; }
        .fs-modal { position:fixed; inset:0; z-index:80; background:rgba(0,0,0,.65);
          display:flex; align-items:center; justify-content:center; padding:20px; }
        .fs-modal-box { width:100%; max-width:340px; background:#fff; color:#17102b; border-radius:16px; padding:22px; text-align:center; }
        .fs-modal-box h3 { margin:0 0 8px; font-size:17px; }
        .fs-modal-box p { margin:0 0 16px; font-size:14px; color:#6b6480; line-height:1.5; }
        .fs-modal-err { color:#d1293d !important; font-weight:600; }
        .fs-modal-actions { display:flex; gap:10px; }
        .fs-modal-actions button { flex:1; padding:11px; border-radius:10px; border:none; font-weight:700; font-size:14px; cursor:pointer; }
        .fs-cancel { background:#f1edf9; color:#17102b; } .fs-delete { background:#d1293d; color:#fff; }
        .fs-modal-actions button:disabled { opacity:.6; cursor:not-allowed; }
        @media (max-width:640px) { .fs-nav { display:none; } }
      `}</style>

      <div className="fs-top">
        <button type="button" className="fs-round" aria-label="Close"
          onClick={() => close(post?.id, filter)}>
          <X size={22} />
        </button>
        <div className="fs-top-right">
          {visible.length > 0 && <span className="fs-count">{index + 1} / {visible.length}</span>}
          {post?.media.type === 'image' && (
            <button type="button" className="fs-round" onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? 'Zoom out' : 'Zoom in'}>
              {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
          )}
          {post && (
            <button type="button" className="fs-round" aria-label="Delete post"
              onClick={() => { setDeleteError(''); setConfirmOpen(true); }}>
              <Trash2 size={19} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="fs-msg">Loading…</p>
      ) : !post ? (
        <p className="fs-msg">No images or videos to show.</p>
      ) : (
        <>
          <div className="fs-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className={`fs-scroll ${zoomed ? 'zoomed' : ''}`}>
              {post.media.type === 'image' ? (
                <img
                  key={post.id}
                  className={`fs-img ${zoomed ? 'zoomed' : ''}`}
                  src={post.media.src}
                  alt={post.caption || 'Post image'}
                  onClick={() => setZoomed((z) => !z)}
                  draggable={false}
                />
              ) : (
                <video
                  key={post.id}
                  className="fs-video"
                  src={post.media.src}
                  poster={post.media.poster}
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              )}
            </div>
          </div>

          {index > 0 && (
            <button className="fs-nav left" onClick={() => go(-1)} aria-label="Previous">
              <ChevronLeft size={26} />
            </button>
          )}
          {index < visible.length - 1 && (
            <button className="fs-nav right" onClick={() => go(1)} aria-label="Next">
              <ChevronRight size={26} />
            </button>
          )}

          <div className={`fs-bottom ${post.media.type === 'video' ? 'fs-video-lift' : ''}`}>
            {post.caption && <p className="fs-caption">{post.caption}</p>}
            <div className="fs-actions">
              <button type="button" className={`fs-act ${post.appreciated ? 'on-pink' : ''}`}
                onClick={() => toggleReaction(post.id, 'APPRECIATE')}>
                <Heart size={24} fill={post.appreciated ? 'currentColor' : 'none'} />{fmt(post.appreciations)}
              </button>
              <button type="button" className={`fs-act ${post.helpful ? 'on-blue' : ''}`}
                onClick={() => toggleReaction(post.id, 'HELPFUL')}>
                <Sparkles size={24} />{fmt(post.helpfulCount)}
              </button>
              <button type="button" className={`fs-act ${post.learned ? 'on-green' : ''}`}
                onClick={() => toggleLearned(post.id)}>
                <CheckCircle2 size={24} />{fmt(post.learnedCount)}
              </button>
              <button type="button" className="fs-act"
                onClick={() => setCommentPostId(String(post.id))}>
                <MessageCircle size={24} />{fmt(post.comments)}
              </button>
            </div>
          </div>
        </>
      )}

      {confirmOpen && (
        <div className="fs-modal" role="dialog" aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmOpen(false); }}>
          <div className="fs-modal-box">
            <h3>Delete this post?</h3>
            <p>This will permanently delete the post and its reactions and comments.</p>
            {deleteError && <p className="fs-modal-err" role="alert">{deleteError}</p>}
            <div className="fs-modal-actions">
              <button type="button" className="fs-cancel"
                onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</button>
              <button type="button" className="fs-delete"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentPostId && (
        <CommentPanel
          postId={commentPostId}
          currentUser={user}
          onClose={() => setCommentPostId(null)}
          onCountChange={onCommentCount}
        />
      )}
    </div>
  );
}
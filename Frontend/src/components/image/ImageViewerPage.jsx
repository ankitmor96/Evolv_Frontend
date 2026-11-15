import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Heart, Sparkles, CheckCircle2, MessageCircle, Trash2,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import { navigate } from '../../utils/navigate.js';
import CommentPanel from '../shared/CommentPanel.jsx';
import { takeListPosts, clearListPosts } from '../../utils/listPosts.js';
import "../image/ImageViewerPage.css"

const isImage = (p) => p.media?.type === 'image' && p.media?.src;
const fmt = (n = 0) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n));

function goBack() {
  const back = sessionStorage.getItem('evolv-image-back') || '/home';
  sessionStorage.removeItem('evolv-image-back');
  clearListPosts();
  navigate(back);
}


export default function ImageViewerPage() {
  const user = authService.getCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const pending = useRef(new Set());
  const postsRef = useRef([]);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  // Load feed + my posts, keep only images
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const given = takeListPosts();
        if (given) {
          const list = given.filter(isImage);
          if (cancelled) return;
          setPosts(list);
          const startId = sessionStorage.getItem('evolv-image-start');
          const i = list.findIndex((p) => String(p.id) === startId);
          setIndex(i >= 0 ? i : 0);
          return;
        }
        const userId = user?.id ?? user?.userId ?? user?._id ?? null;
        const [feedRes, mine] = await Promise.all([
          homePostService.getFeedPosts().catch(() => ({ posts: [] })),
          homePostService.getMyPosts(userId).catch(() => []),
        ]);
        const feed = (feedRes?.posts ?? []).map((p) => homePostService._normalisePost(p));
        const map = new Map();
        [...(mine || []), ...feed].forEach((p) => {
          if (p?.id && isImage(p)) map.set(String(p.id), p);
        });
        const list = [...map.values()];
        if (cancelled) return;
        setPosts(list);

        const startId = sessionStorage.getItem('evolv-image-start');
        if (startId) {
          const i = list.findIndex((p) => String(p.id) === startId);
          if (i >= 0) setIndex(i);
          sessionStorage.removeItem('evolv-image-start');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const REACTION_FIELDS = {
    APPRECIATE: { flag: 'appreciated', count: 'appreciations' },
    HELPFUL: { flag: 'helpful', count: 'helpfulCount' },
  };

  const toggleReaction = useCallback(async (postId, type) => {
    const key = `reaction:${postId}:${type}`;
    if (pending.current.has(key)) return;

    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) { pending.current.delete(key); return; }

    const mine = REACTION_FIELDS[type];
    const was = Boolean(current[mine.flag]);
    const next = !was;

    // Optimistic update: only this reaction changes
    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : {
        ...p,
        [mine.flag]: next,
        [mine.count]: Math.max(0, (p[mine.count] ?? 0) + (next ? 1 : -1)),
      }
    ));

    try {
      if (was) await homePostService.removeReaction(postId, type);
      else await homePostService.addReaction(postId, type);
    } catch (err) {
      if (was && err.status === 404) {
        console.warn('[ImageViewer] reaction already removed on server');
      } else {
        console.warn('[ImageViewer] reaction failed, rolling back:', err.message);
        setPosts(snapshot);
      }
    } finally {
      pending.current.delete(key);
    }
  }, []);

  const go = useCallback((dir) => {
    setZoomed(false);
    setConfirmDelete(false);
    setDeleteError('');
    setIndex((i) => Math.min(Math.max(i + dir, 0), Math.max(posts.length - 1, 0)));
  }, [posts.length]);

  // Keyboard: arrows, Esc
  useEffect(() => {
    const onKey = (e) => {
      if (commentPostId) return;
      if (e.key === 'Escape') goBack();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, commentPostId]);

  // Optimistic toggle with rollback
  const toggle = useCallback(async (postId, flag, countKey, onApi, offApi) => {
    const key = `${flag}:${postId}`;
    if (pending.current.has(key)) return;
    pending.current.add(key);

    const snapshot = postsRef.current;
    const current = snapshot.find((p) => String(p.id) === String(postId));
    if (!current) { pending.current.delete(key); return; }

    const was = Boolean(current[flag]);
    const next = !was;

    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : {
        ...p,
        [flag]: next,
        [countKey]: Math.max(0, (p[countKey] ?? 0) + (next ? 1 : -1)),
      }));

    try {
      await (was ? offApi() : onApi());
    } catch (err) {
      console.warn('[ImageViewer] toggle failed, rolling back:', err.message);
      setPosts(snapshot);
    } finally {
      pending.current.delete(key);
    }
  }, []);

  const onCommentCount = useCallback((postId, delta) => {
    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : { ...p, comments: Math.max(0, (p.comments ?? 0) + delta) }));
  }, []);
  const handleDelete = useCallback(async () => {
    const target = posts[index];
    if (!target || deleting) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await homePostService.deletePost(target.id);

      const remaining = posts.filter((p) => String(p.id) !== String(target.id));
      setPosts(remaining);
      setConfirmDelete(false);
      setZoomed(false);

      if (remaining.length === 0) {
        goBack();
      } else {
        setIndex((i) => Math.min(i, remaining.length - 1));
      }
    } catch (err) {
      console.error('[ImageViewer] delete failed:', err);
      setDeleteError(err.message || 'Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [posts, index, deleting]);

  if (!user) return null;

  const post = posts[index];
  const creator = post?.creator || {};
  const userId = user?.id ?? user?.userId ?? user?._id ?? null;
  const creatorId = creator?.id ?? creator?.userId ?? post?.userId ?? null;
  const isOwner =
    userId != null && creatorId != null && String(userId) === String(creatorId);

  return (
    <div className="iv-page">
      <button type="button" className="iv-back" onClick={goBack} aria-label="Back">
        <ArrowLeft size={20} /> <span>Back</span>
      </button>

      {loading ? (
        <div className="iv-empty">Loading…</div>
      ) : !post ? (
        <div className="iv-empty">Image not found.</div>
      ) : (
        <div className="iv-layout">
          {/* ── Image area ── */}
          <div className="iv-stage">
            <div className={`iv-scroll ${zoomed ? 'zoomed' : ''}`}>
              <img
                key={post.id}
                src={post.media.src}
                alt={post.caption || 'Post image'}
                className={`iv-img ${zoomed ? 'zoomed' : ''}`}
                onClick={() => setZoomed((z) => !z)}
                draggable={false}
              />
            </div>

            {index > 0 && (
              <button className="iv-nav left" onClick={() => go(-1)} aria-label="Previous image">
                <ChevronLeft size={24} />
              </button>
            )}
            {index < posts.length - 1 && (
              <button className="iv-nav right" onClick={() => go(1)} aria-label="Next image">
                <ChevronRight size={24} />
              </button>
            )}

            <button className="iv-zoom" onClick={() => setZoomed((z) => !z)} aria-label={zoomed ? 'Zoom out' : 'Zoom in'}>
              {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>

            <span className="iv-counter">{index + 1} / {posts.length}</span>
          </div>

          {/* ── Details ── */}
          <aside className="iv-details">
            <div className="iv-creator">
              {creator.avatar ? (
                <img src={creator.avatar} alt={creator.name} className="iv-avatar" />
              ) : (
                <span className="iv-avatar iv-avatar-fallback">{(creator.name || 'U')[0].toUpperCase()}</span>
              )}
              <div>
                <strong>{creator.name || 'EVOLV member'}</strong>
                <span>{post.timestamp}</span>
              </div>
            </div>

            {post.tags?.length > 0 && (
              <div className="iv-tags">{post.tags.map((t) => <span key={t}>{t}</span>)}</div>
            )}

            <p className="iv-caption">{post.caption || 'No caption added.'}</p>

            <div className="iv-actions">
              <button className={`iv-act ${post.appreciated ? 'on pink' : ''}`}
                onClick={() => toggleReaction(post.id, 'APPRECIATE')}>
                <Heart size={20} fill={post.appreciated ? 'currentColor' : 'none'} />
                <strong>{fmt(post.appreciations)}</strong><span>Appreciate</span>
              </button>

              <button className={`iv-act ${post.helpful ? 'on blue' : ''}`}
                onClick={() => toggleReaction(post.id, 'HELPFUL')}>
                <Sparkles size={20} />
                <strong>{fmt(post.helpfulCount)}</strong><span>Helpful</span>
              </button>

              <button className={`iv-act ${post.learned ? 'on green' : ''}`}
                onClick={() => toggle(post.id, 'learned', 'learnedCount',
                  () => homePostService.markLearned(post.id),
                  () => homePostService.unmarkLearned(post.id))}>
                <CheckCircle2 size={20} />
                <strong>{fmt(post.learnedCount)}</strong><span>Learned</span>
              </button>

              <button className="iv-act" onClick={() => setCommentPostId(String(post.id))}>
                <MessageCircle size={20} />
                <strong>{fmt(post.comments)}</strong><span>Discuss</span>
              </button>

            </div>
            {isOwner && (
              <div className="iv-delete-zone">
                {deleteError && <p className="iv-delete-error" role="alert">{deleteError}</p>}

                {!confirmDelete ? (
                  <button
                    type="button"
                    className="iv-delete-btn"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete this post"
                  >
                    <Trash2 size={16} /> Delete Post
                  </button>
                ) : (
                  <div className="iv-delete-confirm">
                    <p>Are you sure you want to permanently delete this post?</p>
                    <div className="iv-delete-actions">
                      <button
                        type="button"
                        className="iv-delete-cancel"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="iv-delete-yes"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting…' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
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
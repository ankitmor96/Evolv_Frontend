import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Heart, Sparkles, CheckCircle2, MessageCircle,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import CommentPanel from '../shared/CommentPanel.jsx';
import "../image/ImageViewerPage.css"

const isImage = (p) => p.media?.type === 'image' && p.media?.src;
const fmt = (n = 0) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n));

function goBack() {
  const back = sessionStorage.getItem('evolv-image-back') || '/home';
  sessionStorage.removeItem('evolv-image-back');
  window.location.hash = back;
  window.dispatchEvent(new Event('navigated'));
}

export default function ImageViewerPage() {
  const user = authService.getCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [commentPostId, setCommentPostId] = useState(null);
  const pending = useRef(new Set());

  // Load feed + my posts, keep only images
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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

  const go = useCallback((dir) => {
    setZoomed(false);
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

    let before;
    setPosts((ps) => {
      before = ps;
      return ps.map((p) => {
        if (String(p.id) !== String(postId)) return p;
        const next = !p[flag];
        return { ...p, [flag]: next, [countKey]: Math.max(0, (p[countKey] ?? 0) + (next ? 1 : -1)) };
      });
    });

    try {
      const was = before?.find((p) => String(p.id) === String(postId))?.[flag];
      await (was ? offApi() : onApi());
    } catch (err) {
      console.warn('[ImageViewer] reaction failed, rolling back:', err.message);
      setPosts(before);
    } finally {
      pending.current.delete(key);
    }
  }, []);

  const onCommentCount = useCallback((postId, delta) => {
    setPosts((ps) => ps.map((p) =>
      String(p.id) !== String(postId) ? p : { ...p, comments: Math.max(0, (p.comments ?? 0) + delta) }));
  }, []);

  if (!user) return null;

  const post = posts[index];
  const creator = post?.creator || {};

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
                onClick={() => toggle(post.id, 'appreciated', 'appreciations',
                  () => homePostService.addReaction(post.id, 'APPRECIATE'),
                  () => homePostService.removeReaction(post.id, 'APPRECIATE'))}>
                <Heart size={20} fill={post.appreciated ? 'currentColor' : 'none'} />
                <strong>{fmt(post.appreciations)}</strong><span>Appreciate</span>
              </button>
              <button className={`iv-act ${post.helpful ? 'on blue' : ''}`}
                onClick={() => toggle(post.id, 'helpful', 'helpfulCount',
                  () => homePostService.addReaction(post.id, 'HELPFUL'),
                  () => homePostService.removeReaction(post.id, 'HELPFUL'))}>
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
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, Heart, Sparkles, CheckCircle2, MessageCircle,
  Volume2, VolumeX, Play,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import CommentPanel from '../shared/CommentPanel.jsx';
import "../reels/ReelPage.css";

const isVideo = (p) => (p.media?.type === 'video' || p.type === 'reel') && p.media?.src;

const fmt = (n = 0) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n));

function goBack() {
  const back = sessionStorage.getItem('evolv-reel-back') || '/home';
  sessionStorage.removeItem('evolv-reel-back');
  window.location.hash = back;
  window.dispatchEvent(new Event('navigated'));
}

// ─── One reel ────────────────────────────────────────────────────────────────
function ReelItem({ post, muted, setMuted, onAppreciate, onHelpful, onLearned, onDiscuss }) {
  const itemRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1) {
      setIsLandscape(v.videoWidth > v.videoHeight);
    }
  }, []);

  // Play only the reel that is mostly visible
  useEffect(() => {
    const el = itemRef.current;
    const video = videoRef.current;
    if (!el || !video) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
          video.pause();
          video.currentTime = 0;
          setPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const creator = post.creator || {};
  const initial = (creator.name || 'U')[0].toUpperCase();

  return (
    <section className="rl-item" ref={itemRef} data-post-id={post.id}>
      <div className="rl-card">
        <div className="rl-media">
          {isLandscape && post.media.poster && (
            <div
              className="rl-backdrop"
              style={{ backgroundImage: `url(${post.media.poster})` }}
            />
          )}

          <video
            ref={videoRef}
            src={post.media.src}
            poster={post.media.poster}
            className={`rl-video ${isLandscape ? 'rl-video--landscape' : ''}`}
            loop
            playsInline
            muted={muted}
            preload="metadata"
            onClick={togglePlay}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setIsLandscape(v.videoWidth > v.videoHeight);
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
            }}
          />
        </div>

        {!playing && (
          <button type="button" className="rl-play" onClick={togglePlay} aria-label="Play">
            <Play size={28} fill="currentColor" />
          </button>
        )}

        <button
          type="button"
          className="rl-mute"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Bottom overlay: creator + caption */}
        <div className="rl-overlay">
          {post.tags?.length > 0 && (
            <div className="rl-tags">
              {post.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}
            </div>
          )}
          <div className="rl-creator">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="rl-avatar" />
            ) : (
              <span className="rl-avatar rl-avatar-fallback">{initial}</span>
            )}
            <div className="rl-creator-info">
              <strong>{creator.name || 'EVOLV member'}</strong>
              <span>{post.timestamp}</span>
            </div>
          </div>
          {post.caption && <p className="rl-caption">{post.caption}</p>}
        </div>

        <div className="rl-progress"><span style={{ width: `${progress}%` }} /></div>

        {/* Actions: beside the card on desktop, over the video on mobile */}
        <div className="rl-actions">
          <button className={`rl-act ${post.appreciated ? 'on pink' : ''}`} onClick={() => onAppreciate(post.id)} aria-label="Appreciate">
            <Heart size={22} fill={post.appreciated ? 'currentColor' : 'none'} />
            <span>{fmt(post.appreciations)}</span>
          </button>
          <button className={`rl-act ${post.helpful ? 'on blue' : ''}`} onClick={() => onHelpful(post.id)} aria-label="Helpful">
            <Sparkles size={22} />
            <span>{fmt(post.helpfulCount)}</span>
          </button>
          <button className={`rl-act ${post.learned ? 'on green' : ''}`} onClick={() => onLearned(post.id)} aria-label="Learned">
            <CheckCircle2 size={22} />
            <span>{fmt(post.learnedCount)}</span>
          </button>
          <button className="rl-act" onClick={() => onDiscuss(post.id)} aria-label="Discuss">
            <MessageCircle size={22} />
            <span>{fmt(post.comments)}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ReelsPage() {
  const user = authService.getCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [commentPostId, setCommentPostId] = useState(null);
  const feedRef = useRef(null);
  const pending = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId =
          user?.id ?? user?.userId ?? user?._id ?? null;

        const [feedRes, mine] = await Promise.all([
          homePostService.getFeedPosts().catch(() => ({ posts: [] })),
          homePostService.getMyPosts(userId).catch(() => []),
        ]);

        const feed = (feedRes?.posts ?? []).map((p) =>
          homePostService._normalisePost(p)
        );

        const map = new Map();

        [...(mine || []), ...feed].forEach((p) => {
          if (p?.id && isVideo(p)) {
            map.set(String(p.id), p);
          }
        });

        // Attach actual comment counts before updating the UI
        const uniquePosts = [...map.values()];

        const withCounts =
          await homePostService.attachCommentCounts(uniquePosts);

        if (!cancelled) {
          setPosts(withCounts);
        }
      } catch (error) {
        console.error("Failed to load reels:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };

  }, []);


  // Jump to the reel that was clicked
  useEffect(() => {
    if (loading || posts.length === 0) return;
    const startId = sessionStorage.getItem('evolv-reel-start');
    if (!startId) return;
    const el = feedRef.current?.querySelector(`[data-post-id="${startId}"]`);
    if (el) el.scrollIntoView();
    sessionStorage.removeItem('evolv-reel-start');
  }, [loading, posts.length]);

  // Esc = back
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !commentPostId) goBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commentPostId]);

  // Generic optimistic toggle with rollback
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
      console.warn('[Reels] reaction failed, rolling back:', err.message);
      setPosts(before);
    } finally {
      pending.current.delete(key);
    }
  }, []);

  const onAppreciate = (id) => toggle(id, 'appreciated', 'appreciations',
    () => homePostService.addReaction(id, 'APPRECIATE'), () => homePostService.removeReaction(id, 'APPRECIATE'));
  const onHelpful = (id) => toggle(id, 'helpful', 'helpfulCount',
    () => homePostService.addReaction(id, 'HELPFUL'), () => homePostService.removeReaction(id, 'HELPFUL'));
  const onLearned = (id) => toggle(id, 'learned', 'learnedCount',
    () => homePostService.markLearned(id), () => homePostService.unmarkLearned(id));

  const onCommentSync = useCallback((postId, total) => {
    setPosts((ps) =>
      ps.map((p) =>
        String(p.id) !== String(postId)
          ? p
          : { ...p, comments: total }
      )
    );
  }, []);

  const onCommentCount = useCallback((postId, delta) => {
    setPosts((ps) =>
      ps.map((p) =>
        String(p.id) !== String(postId)
          ? p
          : {
            ...p,
            comments: Math.max(
              0,
              (Number(p.comments) || 0) + delta
            ),
          }
      )
    );
  }, []);

  if (!user) return null;

  return (
    <div className="rl-page">
      <button type="button" className="rl-back" onClick={goBack} aria-label="Back">
        <ArrowLeft size={20} /> <span>Reels</span>
      </button>

      {loading ? (
        <div className="rl-empty">Loading reels…</div>
      ) : posts.length === 0 ? (
        <div className="rl-empty">No short videos yet.</div>
      ) : (
        <div className="rl-feed" ref={feedRef}>
          {posts.map((post) => (
            <ReelItem
              key={post.id}
              post={post}
              muted={muted}
              setMuted={setMuted}
              onAppreciate={onAppreciate}
              onHelpful={onHelpful}
              onLearned={onLearned}
              onDiscuss={(id) => setCommentPostId(String(id))}
            />
          ))}
        </div>
      )}

      {commentPostId && (
        <CommentPanel
          postId={commentPostId}
          currentUser={user}
          onClose={() => setCommentPostId(null)}
          onCountChange={onCommentCount}
          onCountSync={onCommentSync}
        />
      )}
    </div>
  );
}
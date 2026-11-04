import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ArrowLeft, Heart, Sparkles, CheckCircle2, MessageCircle, Trash2,
    FileText, Download, MoreHorizontal, Volume2, VolumeX, Play,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import { getProfile } from '../../services/getProfile.js';
import CommentPanel from '../shared/CommentPanel.jsx';

const fmt = (n = 0) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(n));
const isMedia = (p) =>
    ['image', 'video', 'document'].includes(p?.media?.type) && p?.media?.src;

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Videos' },
    { id: 'document', label: 'Documents' },
];

const REACTION_FIELDS = {
    APPRECIATE: { flag: 'appreciated', count: 'appreciations' },
    HELPFUL: { flag: 'helpful', count: 'helpfulCount' },
};

function goBack() {
    const back = sessionStorage.getItem('evolv-myposts-back') || '/profile';
    sessionStorage.removeItem('evolv-myposts-back');
    navigate(back);
    window.dispatchEvent(new Event('navigated'));
}
function openFullScreen(postId, filter) {
    sessionStorage.setItem('evolv-fs-start', String(postId));
    sessionStorage.setItem('evolv-fs-filter', filter);
    navigate('/my-post-view');
    window.dispatchEvent(new Event('navigated'));
}

// ── Reels-style video: autoplay (muted) when visible, tap to pause ──
function PostVideo({ src, poster, onOpen }) {
    const boxRef = useRef(null);
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(true);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        const box = boxRef.current;
        const video = videoRef.current;
        if (!box || !video) return undefined;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.intersectionRatio >= 0.6) video.play().catch(() => { });
                else video.pause();
            },
            { threshold: [0, 0.6] }
        );
        io.observe(box);
        return () => io.disconnect();
    }, []);

    return (
        <div className="mv-video" ref={boxRef}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                muted={muted}
                loop
                playsInline
                preload="metadata"
                onClick={onOpen}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
            />
            {paused && (
                <span className="mv-video-play" aria-hidden="true"><Play size={28} fill="currentColor" /></span>
            )}
            <button
                type="button"
                className="mv-mute"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
            >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
        </div>
    );
}

export default function MyPostsViewerPage() {
    const user = authService.getCurrentUser();
    const userId = user?.id ?? user?.userId ?? user?._id ?? null;

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [me, setMe] = useState({ avatar: '', name: '' });
    const [commentPostId, setCommentPostId] = useState(null);
    const [menuPostId, setMenuPostId] = useState(null);
    const [confirmPost, setConfirmPost] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const pending = useRef(new Set());
    const postsRef = useRef([]);
    const scrollRef = useRef(null);
    const startIdRef = useRef(null);
    useEffect(() => { postsRef.current = posts; }, [posts]);

    const visible = filter === 'all' ? posts : posts.filter((p) => p.media.type === filter);

    // ── Your profile photo + name ──
    useEffect(() => {
        let cancelled = false;
        getProfile.getProfile()
            .then((p) => {
                if (cancelled) return;
                setMe({
                    avatar: p?.avatarUrl ?? p?.avatar ?? '',
                    name: p?.fullName ?? p?.name ?? p?.username ?? '',
                });
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, []);

    // ── Load ONLY the logged-in user's posts ──
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const mine = await homePostService.getMyPosts(userId).catch(() => []);
                const list = (mine || []).filter(isMedia);

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

                const startFilter = sessionStorage.getItem('evolv-myposts-filter') || 'all';
                startIdRef.current = sessionStorage.getItem('evolv-myposts-start');
                sessionStorage.removeItem('evolv-myposts-filter');
                sessionStorage.removeItem('evolv-myposts-start');

                setPosts(enriched);
                setFilter(startFilter);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll to the post the user tapped on the profile
    useEffect(() => {
        if (loading || !startIdRef.current) return;
        const id = startIdRef.current;
        startIdRef.current = null;
        requestAnimationFrame(() => {
            document.getElementById(`mv-post-${id}`)?.scrollIntoView({ block: 'start' });
        });
    }, [loading]);

    const changeFilter = (id) => {
        setFilter(id);
        setMenuPostId(null);
        scrollRef.current?.scrollTo({ top: 0 });
    };

    // Esc: close popup first, otherwise go back
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape' || commentPostId) return;
            if (confirmPost) { setConfirmPost(null); return; }
            if (menuPostId) { setMenuPostId(null); return; }
            goBack();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [commentPostId, confirmPost, menuPostId]);

    // Appreciate / Helpful (independent of each other)
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

    // Delete (images, videos and documents)
    const handleDelete = useCallback(async () => {
        if (!confirmPost || deleting) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await homePostService.deletePost(confirmPost.id);
            const remaining = postsRef.current.filter((p) => String(p.id) !== String(confirmPost.id));
            setPosts(remaining);
            setConfirmPost(null);
            if (remaining.length === 0) goBack();
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete post. Please try again.');
        } finally {
            setDeleting(false);
        }
    }, [confirmPost, deleting]);

    if (!user) return null;

    const displayName = me.name || user?.name || 'You';
    const avatar = me.avatar || user?.avatar || '';

    const renderMedia = (post) => {
        const type = post.media.type;
        if (type === 'image') {
            return (
                <div className="mv-image" onClick={() => openFullScreen(post.id, filter)}
                    role="button" tabIndex={0} aria-label="View full screen"
                    onKeyDown={(e) => { if (e.key === 'Enter') openFullScreen(post.id, filter); }}>
                    <img src={post.media.src} alt={post.caption || 'Post image'} loading="lazy" draggable={false} />
                </div>
            );
        }
        if (type === 'video') {
            return (
                <PostVideo
                    src={post.media.src}
                    poster={post.media.poster}
                    onOpen={() => openFullScreen(post.id, filter)}
                />
            );
        }
        const name = post.media.fileName && post.media.fileName !== 'Document'
            ? post.media.fileName
            : post.caption || 'Document';
        return (
            <div className="mv-doc">
                <span className="mv-doc-icon"><FileText size={40} /></span>
                <h3>{name}</h3>
                <p>Document attachment</p>
                <a href={post.media.src} target="_blank" rel="noopener noreferrer">
                    Open
                </a>
            </div>
        );
    };

    return (
        <div className="mv-page">
            <style>{`
            .mv-image { cursor:pointer; }
        .mv-page { position:fixed; inset:0; z-index:50; background:#f4f3fa; color:#17102b;
          display:flex; flex-direction:column; font-family:inherit; }

        /* top bar */
        .mv-topbar { flex:0 0 auto; background:#fff; border-bottom:1px solid #e8e4f0; padding:10px 14px 0; }
        .mv-topbar-row { display:flex; align-items:center; gap:12px; max-width:520px; margin:0 auto; }
        .mv-back { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:none;
          border-radius:999px; background:#f1edf9; color:#17102b; font-weight:600; font-size:14px; cursor:pointer; }
        .mv-back:hover { background:#e7e0f5; }
        .mv-title { font-size:16px; font-weight:700; }
        .mv-filters { display:flex; gap:8px; max-width:520px; margin:10px auto 0; padding-bottom:10px;
          overflow-x:auto; scrollbar-width:none; }
        .mv-filters::-webkit-scrollbar { display:none; }
        .mv-filter { flex:0 0 auto; padding:7px 14px; border-radius:999px; border:1px solid #e0daee;
          background:#fff; color:#4a4260; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
        .mv-filter.active { background:#aa45f5; border-color:#aa45f5; color:#fff; }

        /* feed */
        .mv-scroll { flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:14px 0 40px; }
        .mv-feed { max-width:470px; margin:0 auto; display:flex; flex-direction:column; gap:14px; padding:0 10px; }
        .mv-empty { text-align:center; color:#77727f; padding:60px 20px; font-size:15px; }

        /* post card */
        .mv-card { background:#fff; border:1px solid #e8e4f0; border-radius:14px; overflow:visible;
          scroll-margin-top:10px; }
        .mv-head { display:flex; align-items:center; gap:10px; padding:10px 12px; position:relative; }
        .mv-avatar { width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0; background:#aa45f5; }
        .mv-avatar-fb { display:inline-flex; align-items:center; justify-content:center; color:#fff;
          font-weight:700; font-size:15px; }
        .mv-who { flex:1; min-width:0; display:flex; flex-direction:column; line-height:1.25; }
        .mv-who strong { font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mv-who span { font-size:12px; color:#8b7aa3; }
        .mv-more { border:none; background:transparent; padding:6px; border-radius:50%; cursor:pointer; color:#17102b; }
        .mv-more:hover { background:#f1edf9; }
        .mv-menu-backdrop { position:fixed; inset:0; z-index:8; background:transparent; border:0; cursor:default; }
        .mv-menu { position:absolute; right:10px; top:48px; z-index:9; min-width:170px; background:#fff;
          border:1px solid #e8e4f0; border-radius:12px; box-shadow:0 8px 24px rgba(23,16,43,.15); padding:6px; }
        .mv-menu button { width:100%; display:flex; align-items:center; gap:10px; padding:10px 12px; border:none;
          background:transparent; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; color:#d1293d; }
        .mv-menu button:hover { background:#fff1f2; }

        /* media */
        .mv-image { background:#f4f3fa; display:flex; justify-content:center; }
        .mv-image img { display:block; width:100%; max-height:75vh; object-fit:contain; }
        .mv-video { position:relative; background:#000; display:flex; justify-content:center; }
        .mv-video video { display:block; width:100%; max-height:78vh; aspect-ratio:9/16; object-fit:cover; background:#000; cursor:pointer; }
        .mv-video-play { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:62px; height:62px; border-radius:50%; background:rgba(0,0,0,.5); color:#fff;
          display:flex; align-items:center; justify-content:center; pointer-events:none; }
        .mv-mute { position:absolute; top:12px; right:12px; width:38px; height:38px; border-radius:50%; border:none;
          background:rgba(0,0,0,.5); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .mv-doc { display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px;
          padding:36px 20px; background:linear-gradient(180deg,#faf7ff,#f1e9ff); }
        .mv-doc-icon { width:76px; height:76px; border-radius:20px; background:#fff; color:#aa45f5;
          display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(170,69,245,.18); }
        .mv-doc h3 { font-size:16px; margin:6px 0 0; word-break:break-word; }
        .mv-doc p { margin:0; font-size:12px; color:#8b7aa3; }
        .mv-doc a { margin-top:8px; display:inline-flex; align-items:center; gap:8px; padding:10px 18px;
          border-radius:10px; background:#aa45f5; color:#fff; font-weight:600; font-size:14px; text-decoration:none; }

        /* actions */
        .mv-actions { display:flex; align-items:center; gap:18px; padding:10px 14px 4px; }
        .mv-act { display:inline-flex; align-items:center; gap:6px; border:none; background:transparent;
          padding:4px 0; cursor:pointer; color:#17102b; font-size:14px; font-weight:600; transition:transform .15s; }
        .mv-act:active { transform:scale(.9); }
        .mv-act.on-pink { color:#ef476f; }
        .mv-act.on-blue { color:#5b5cf0; }
        .mv-act.on-green { color:#16a05d; }
        .mv-caption { padding:4px 14px 14px; font-size:14px; line-height:1.5; word-break:break-word; }
        .mv-caption strong { margin-right:6px; }
        .mv-tags { padding:0 14px 6px; display:flex; flex-wrap:wrap; gap:6px; }
        .mv-tags span { font-size:12px; color:#aa45f5; font-weight:600; }

        /* delete popup */
        .mv-modal { position:fixed; inset:0; z-index:70; background:rgba(10,6,20,.55);
          display:flex; align-items:center; justify-content:center; padding:20px; }
        .mv-modal-box { width:100%; max-width:340px; background:#fff; border-radius:16px; padding:22px; text-align:center; }
        .mv-modal-box h3 { margin:0 0 8px; font-size:17px; }
        .mv-modal-box p { margin:0 0 16px; font-size:14px; color:#6b6480; line-height:1.5; }
        .mv-modal-err { color:#d1293d !important; font-weight:600; }
        .mv-modal-actions { display:flex; gap:10px; }
        .mv-modal-actions button { flex:1; padding:11px; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; border:1px solid transparent; }
        .mv-btn-cancel { background:#f1edf9; color:#17102b; }
        .mv-btn-delete { background:#d1293d; color:#fff; }
        .mv-modal-actions button:disabled { opacity:.6; cursor:not-allowed; }

        @media (min-width: 900px) { .mv-feed { padding:0; } }
      `}</style>

            <div className="mv-topbar">
                <div className="mv-topbar-row">
                    <button type="button" className="mv-back" onClick={goBack} aria-label="Back">
                        <ArrowLeft size={18} /> Back
                    </button>
                    <span className="mv-title">My Posts</span>
                </div>
                {posts.length > 0 && (
                    <div className="mv-filters" role="tablist" aria-label="Filter your posts">
                        {FILTERS.map((f) => {
                            const count = f.id === 'all'
                                ? posts.length
                                : posts.filter((p) => p.media.type === f.id).length;
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === f.id}
                                    className={`mv-filter ${filter === f.id ? 'active' : ''}`}
                                    onClick={() => changeFilter(f.id)}
                                >
                                    {f.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mv-scroll" ref={scrollRef}>
                {loading ? (
                    <div className="mv-empty">Loading…</div>
                ) : posts.length === 0 ? (
                    <div className="mv-empty">You have no image, video or document posts yet.</div>
                ) : visible.length === 0 ? (
                    <div className="mv-empty">No posts in this section.</div>
                ) : (
                    <div className="mv-feed">
                        {visible.map((post) => (
                            <article className="mv-card" id={`mv-post-${post.id}`} key={post.id}>
                                <div className="mv-head">
                                    {avatar ? (
                                        <img className="mv-avatar" src={avatar} alt={displayName} />
                                    ) : (
                                        <span className="mv-avatar mv-avatar-fb">{displayName[0]?.toUpperCase()}</span>
                                    )}
                                    <div className="mv-who">
                                        <strong>{displayName}</strong>
                                        <span>{post.timestamp}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="mv-more"
                                        aria-label="Post options"
                                        aria-haspopup="true"
                                        aria-expanded={menuPostId === post.id}
                                        onClick={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>

                                    {menuPostId === post.id && (
                                        <>
                                            <button type="button" className="mv-menu-backdrop"
                                                aria-label="Close menu" onClick={() => setMenuPostId(null)} />
                                            <div className="mv-menu" role="menu">
                                                <button type="button" role="menuitem"
                                                    onClick={() => { setMenuPostId(null); setDeleteError(''); setConfirmPost(post); }}>
                                                    <Trash2 size={16} /> Delete post
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {renderMedia(post)}

                                <div className="mv-actions">
                                    <button type="button" title="Appreciate"
                                        className={`mv-act ${post.appreciated ? 'on-pink' : ''}`}
                                        onClick={() => toggleReaction(post.id, 'APPRECIATE')}
                                        aria-pressed={post.appreciated}>
                                        <Heart size={24} fill={post.appreciated ? 'currentColor' : 'none'} />
                                        {fmt(post.appreciations)}
                                    </button>
                                    <button type="button" title="Helpful"
                                        className={`mv-act ${post.helpful ? 'on-blue' : ''}`}
                                        onClick={() => toggleReaction(post.id, 'HELPFUL')}
                                        aria-pressed={post.helpful}>
                                        <Sparkles size={24} />
                                        {fmt(post.helpfulCount)}
                                    </button>
                                    <button type="button" title="Learned"
                                        className={`mv-act ${post.learned ? 'on-green' : ''}`}
                                        onClick={() => toggleLearned(post.id)}
                                        aria-pressed={post.learned}>
                                        <CheckCircle2 size={24} />
                                        {fmt(post.learnedCount)}
                                    </button>
                                    <button type="button" title="Discuss" className="mv-act"
                                        onClick={() => setCommentPostId(String(post.id))}>
                                        <MessageCircle size={24} />
                                        {fmt(post.comments)}
                                    </button>
                                </div>

                                {post.tags?.length > 0 && (
                                    <div className="mv-tags">{post.tags.map((t) => <span key={t}>{t}</span>)}</div>
                                )}
                                <p className="mv-caption">
                                    {post.caption ? (<><strong>{displayName}</strong>{post.caption}</>) : (
                                        <span style={{ color: '#9a95a3' }}>No caption added.</span>
                                    )}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {confirmPost && (
                <div className="mv-modal" role="dialog" aria-modal="true" aria-label="Delete post"
                    onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmPost(null); }}>
                    <div className="mv-modal-box">
                        <h3>Delete this post?</h3>
                        <p>This will permanently delete the post and its reactions and comments.</p>
                        {deleteError && <p className="mv-modal-err" role="alert">{deleteError}</p>}
                        <div className="mv-modal-actions">
                            <button type="button" className="mv-btn-cancel"
                                onClick={() => setConfirmPost(null)} disabled={deleting}>Cancel</button>
                            <button type="button" className="mv-btn-delete"
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
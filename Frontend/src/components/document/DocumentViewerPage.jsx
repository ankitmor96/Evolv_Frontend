import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, FileText,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { homePostService } from '../../services/homePostService.js';
import './DocumentViewerPage.css';

const isDoc = (p) => p?.media?.type === 'document' && p?.media?.src;

function goBack() {
  const back = sessionStorage.getItem('evolv-doc-back') || '/home';
  sessionStorage.removeItem('evolv-doc-back');
  window.location.hash = back;
  window.dispatchEvent(new Event('navigated'));
}

const getExt = (post) => {
  const name = post.media?.fileName || post.media?.src || '';
  const clean = name.split('?')[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
};

// Returns the URL that the iframe should load, or null if we cannot preview
const getPreviewUrl = (post) => {
  const ext = getExt(post);
  const src = post.media.src;
  if (ext === 'pdf' || ext === 'txt' || ext === '') return src;
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(src)}`;
  }
  return null;
};

export default function DocumentViewerPage() {
  const user = authService.getCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);

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
          if (p?.id && isDoc(p)) map.set(String(p.id), p);
        });
        const ownerId = sessionStorage.getItem('evolv-doc-owner');
        sessionStorage.removeItem('evolv-doc-owner');

        let list = [...map.values()];
        if (ownerId) {
          list = list.filter((p) => String(p.creator?.id) === ownerId);
        }
        if (cancelled) return;
        setPosts(list);

        const startId = sessionStorage.getItem('evolv-doc-start');
        if (startId) {
          const i = list.findIndex((p) => String(p.id) === startId);
          if (i >= 0) setIndex(i);
          sessionStorage.removeItem('evolv-doc-start');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((dir) => {
    setIndex((i) => Math.min(Math.max(i + dir, 0), Math.max(posts.length - 1, 0)));
  }, [posts.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') goBack();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 80) go(dx < 0 ? 1 : -1);
  };

  if (!user) return null;

  const post = posts[index];
  const name =
    post?.media?.fileName && post.media.fileName !== 'Document'
      ? post.media.fileName
      : post?.caption || 'Document';
  const previewUrl = post ? getPreviewUrl(post) : null;

  return (
    <div className="dv-page">
      <header className="dv-top">
        <button type="button" className="dv-back" onClick={goBack} aria-label="Back">
          <ArrowLeft size={20} /> <span>Back</span>
        </button>

        <div className="dv-title" title={name}>
          <FileText size={16} aria-hidden="true" />
          <span>{post ? name : 'Document'}</span>
        </div>

        {post && (
          <div className="dv-tools">
            <span className="dv-counter">{index + 1} / {posts.length}</span>
            <a
              className="dv-btn"
              href={post.media.src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </header>

      <main className="dv-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {loading ? (
          <p className="dv-msg">Loading…</p>
        ) : !post ? (
          <p className="dv-msg">Document not found.</p>
        ) : previewUrl ? (
          <iframe key={post.id} className="dv-frame" src={previewUrl} title={name} />
        ) : (
          <div className="dv-nopreview">
            <FileText size={56} />
            <h3>{name}</h3>
            <p>Preview is not available for this file type.</p>
          </div>
        )}

        {index > 0 && (
          <button className="dv-nav left" onClick={() => go(-1)} aria-label="Previous document">
            <ChevronLeft size={24} />
          </button>
        )}
        {index < posts.length - 1 && (
          <button className="dv-nav right" onClick={() => go(1)} aria-label="Next document">
            <ChevronRight size={24} />
          </button>
        )}
      </main>
    </div>
  );
}
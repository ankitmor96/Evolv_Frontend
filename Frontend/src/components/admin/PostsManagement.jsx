import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const baseStyles = `
  .adm-pm-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-pm-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .adm-pm-search {
    display: flex; align-items: center; gap: 0.5rem;
    background: #0D0A15; border: 1px solid rgba(170,69,245,0.15); border-radius: 10px;
    padding: 0.55rem 0.9rem; flex: 1; min-width: 180px; max-width: 320px;
  }
  .adm-pm-search:focus-within { border-color: rgba(170,69,245,0.4); }
  .adm-pm-search input { background: none; border: none; outline: none; color: #F0EBF8; font-size: 0.85rem; width: 100%; font-family: inherit; }
  .adm-pm-search input::placeholder { color: rgba(240,235,248,0.25); }
  .adm-pm-search svg { color: rgba(240,235,248,0.3); flex-shrink: 0; }
  .adm-pm-select {
    background: #0D0A15; border: 1px solid rgba(170,69,245,0.15); border-radius: 10px;
    padding: 0.55rem 0.9rem; color: rgba(240,235,248,0.7); font-size: 0.83rem;
    font-family: inherit; outline: none; cursor: pointer;
  }
  .adm-pm-table-wrap { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; overflow: hidden; }
  .adm-pm-table { width: 100%; border-collapse: collapse; }
  .adm-pm-table th {
    padding: 0.7rem 1rem; font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35);
    text-transform: uppercase; letter-spacing: 0.08em; text-align: left;
    border-bottom: 1px solid rgba(170,69,245,0.07); background: rgba(255,255,255,0.01); white-space: nowrap;
  }
  .adm-pm-table td {
    padding: 0.8rem 1rem; font-size: 0.82rem; color: rgba(240,235,248,0.75);
    border-bottom: 1px solid rgba(170,69,245,0.05); vertical-align: middle;
  }
  .adm-pm-table tr:last-child td { border-bottom: none; }
  .adm-pm-table tr:hover td { background: rgba(170,69,245,0.025); }
  .adm-pm-content-cell { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adm-pm-tag { display: inline-flex; align-items: center; padding: 0.15rem 0.55rem; border-radius: 20px; font-size: 0.68rem; font-weight: 600; }
  .adm-pm-tag-active { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-pm-tag-removed { background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-pm-tag-pending { background: rgba(245,158,11,0.12); color: #FCD34D; }
  .adm-pm-actions { display: flex; align-items: center; gap: 0.4rem; }
  .adm-pm-btn { padding: 0.3rem 0.65rem; border-radius: 7px; border: none; cursor: pointer; font-size: 0.72rem; font-weight: 600; font-family: inherit; transition: opacity 0.15s; }
  .adm-pm-btn:hover { opacity: 0.85; }
  .adm-pm-btn-view { background: rgba(170,69,245,0.15); color: #C084FC; }
  .adm-pm-btn-remove { background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-pm-btn-restore { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-pm-empty { text-align: center; padding: 3rem; color: rgba(240,235,248,0.3); font-size: 0.85rem; }
  .adm-pm-loading { text-align: center; padding: 3rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
  .adm-pm-spinner { width: 18px; height: 18px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin2 0.7s linear infinite; }
  @keyframes adm-spin2 { to { transform: rotate(360deg); } }
  .adm-pm-pagination { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; border-top: 1px solid rgba(170,69,245,0.08); font-size: 0.78rem; color: rgba(240,235,248,0.4); }
  .adm-pm-page-btns { display: flex; gap: 0.35rem; }
  .adm-pm-page-btn { padding: 0.3rem 0.7rem; border-radius: 7px; border: 1px solid rgba(170,69,245,0.15); background: rgba(255,255,255,0.03); color: rgba(240,235,248,0.6); cursor: pointer; font-size: 0.78rem; font-family: inherit; transition: all 0.15s; }
  .adm-pm-page-btn:hover:not(:disabled) { border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-pm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-pm-page-btn-active { background: rgba(170,69,245,0.15); border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-pm-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); }
  .adm-pm-modal { background: #0D0A15; border: 1px solid rgba(170,69,245,0.2); border-radius: 16px; padding: 1.5rem; max-width: 480px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
  .adm-pm-modal-title { font-size: 1rem; font-weight: 700; color: #F0EBF8; margin: 0 0 1rem; display: flex; align-items: center; justify-content: space-between; }
  .adm-pm-modal-close { background: none; border: none; cursor: pointer; color: rgba(240,235,248,0.4); font-size: 1.2rem; padding: 0; transition: color 0.15s; }
  .adm-pm-modal-close:hover { color: #F0EBF8; }
  .adm-pm-modal-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.5rem 0; border-bottom: 1px solid rgba(170,69,245,0.06); font-size: 0.83rem; }
  .adm-pm-modal-key { color: rgba(240,235,248,0.4); font-weight: 500; }
  .adm-pm-modal-val { color: rgba(240,235,248,0.85); text-align: right; max-width: 60%; word-break: break-word; }
  .adm-pm-modal-actions { display: flex; gap: 0.5rem; margin-top: 1.2rem; flex-wrap: wrap; }
  .adm-pm-modal-btn { flex: 1; min-width: 100px; padding: 0.55rem 1rem; border-radius: 9px; border: none; cursor: pointer; font-size: 0.82rem; font-weight: 600; font-family: inherit; transition: opacity 0.15s; }
  .adm-pm-modal-btn:hover { opacity: 0.85; }
  .adm-pm-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.6rem 0.9rem; font-size: 0.8rem; color: #FCA5A5; margin-bottom: 0.75rem; }
`;

function formatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return v; }
}

function StatusTag({ status }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'published') return <span className="adm-pm-tag adm-pm-tag-active">Active</span>;
  if (s === 'removed' || s === 'deleted') return <span className="adm-pm-tag adm-pm-tag-removed">Removed</span>;
  return <span className="adm-pm-tag adm-pm-tag-pending">{status || 'Unknown'}</span>;
}

function extractPosts(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.posts)) return payload.posts;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function PostDetailModal({ post, onClose, onRemove, onRestore }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const isRemoved = (post?.status ?? '').toLowerCase() === 'removed';

  const doAction = async (fn) => {
    setError('');
    setActionLoading(true);
    try { await fn(); onClose(); }
    catch (ex) { setError(ex.message || 'Action failed.'); setActionLoading(false); }
  };

  return (
    <div className="adm-pm-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-pm-modal">
        <div className="adm-pm-modal-title">
          Post Details
          <button className="adm-pm-modal-close" onClick={onClose}>✕</button>
        </div>
        {[
          ['ID', <span key="id" style={{ fontSize: '0.72rem', opacity: 0.5 }}>{post?._id ?? post?.id ?? '—'}</span>],
          ['Author', post?.author?.name ?? post?.author?.username ?? post?.userId ?? '—'],
          ['Content', post?.content ?? post?.caption ?? post?.text ?? '—'],
          ['Type', post?.type ?? post?.mediaType ?? 'text'],
          ['Status', <StatusTag key="s" status={post?.status ?? 'active'} />],
          ['Likes', post?.likes ?? post?.likesCount ?? '—'],
          ['Comments', post?.comments ?? post?.commentsCount ?? '—'],
          ['Created', formatDate(post?.createdAt)],
        ].map(([k, v]) => (
          <div className="adm-pm-modal-row" key={k}>
            <span className="adm-pm-modal-key">{k}</span>
            <span className="adm-pm-modal-val">{v}</span>
          </div>
        ))}
        {error && <div className="adm-pm-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        <div className="adm-pm-modal-actions">
          {isRemoved ? (
            <button
              className="adm-pm-modal-btn"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}
              disabled={actionLoading}
              onClick={() => doAction(() => onRestore(post._id ?? post.id))}
            >
              {actionLoading ? '…' : 'Restore Post'}
            </button>
          ) : (
            <button
              className="adm-pm-modal-btn"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}
              disabled={actionLoading}
              onClick={() => doAction(() => onRemove(post._id ?? post.id))}
            >
              {actionLoading ? '…' : 'Remove Post'}
            </button>
          )}
          <button
            className="adm-pm-modal-btn"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,235,248,0.6)' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

export default function PostsManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminService.getPosts(params);
      setPosts(extractPosts(res));
      setTotal(res?.total ?? res?.data?.total ?? extractPosts(res).length);
    } catch (ex) {
      setError(ex.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleRemove = async (id) => {
    await adminService.deletePost(id);
    fetchPosts();
  };

  const handleRestore = async (id) => {
    await adminService.restorePost(id);
    fetchPosts();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminProtectedRoute>
      <style>{baseStyles}</style>
      <AdminLayout pageTitle="Posts Management">
        <div className="adm-pm-root">
          <div className="adm-pm-toolbar">
            <div className="adm-pm-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search posts…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="adm-pm-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          {error && <div className="adm-pm-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="adm-pm-table-wrap">
            <table className="adm-pm-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Likes</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}><div className="adm-pm-loading"><div className="adm-pm-spinner" /> Loading posts…</div></td></tr>
                ) : posts.length === 0 ? (
                  <tr><td colSpan={7}><div className="adm-pm-empty">No posts found.</div></td></tr>
                ) : posts.map((p, i) => {
                  const isRemoved = (p?.status ?? '').toLowerCase() === 'removed';
                  return (
                    <tr key={p._id ?? p.id ?? i}>
                      <td className="adm-pm-content-cell">{p.content ?? p.caption ?? p.text ?? '—'}</td>
                      <td>{p.author?.name ?? p.author?.username ?? p.userId ?? '—'}</td>
                      <td>{p.type ?? p.mediaType ?? 'text'}</td>
                      <td>{p.likesCount ?? p.likes ?? '—'}</td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td><StatusTag status={p.status ?? 'active'} /></td>
                      <td>
                        <div className="adm-pm-actions">
                          <button className="adm-pm-btn adm-pm-btn-view" onClick={() => setSelectedPost(p)}>View</button>
                          {isRemoved ? (
                            <button className="adm-pm-btn adm-pm-btn-restore" onClick={() => handleRestore(p._id ?? p.id)}>Restore</button>
                          ) : (
                            <button className="adm-pm-btn adm-pm-btn-remove" onClick={() => handleRemove(p._id ?? p.id)}>Remove</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="adm-pm-pagination">
              <span>Showing {posts.length} of {total} posts</span>
              <div className="adm-pm-page-btns">
                <button className="adm-pm-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pg > totalPages) return null;
                  return (
                    <button key={pg} className={`adm-pm-page-btn${pg === page ? ' adm-pm-page-btn-active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                  );
                })}
                <button className="adm-pm-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          </div>
        </div>

        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => { setSelectedPost(null); fetchPosts(); }}
            onRemove={handleRemove}
            onRestore={handleRestore}
          />
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


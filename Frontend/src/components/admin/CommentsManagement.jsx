import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-cm-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-cm-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .adm-cm-search { display: flex; align-items: center; gap: 0.5rem; background: #0D0A15; border: 1px solid rgba(170,69,245,0.15); border-radius: 10px; padding: 0.55rem 0.9rem; flex: 1; min-width: 180px; max-width: 320px; }
  .adm-cm-search:focus-within { border-color: rgba(170,69,245,0.4); }
  .adm-cm-search input { background: none; border: none; outline: none; color: #F0EBF8; font-size: 0.85rem; width: 100%; font-family: inherit; }
  .adm-cm-search input::placeholder { color: rgba(240,235,248,0.25); }
  .adm-cm-search svg { color: rgba(240,235,248,0.3); flex-shrink: 0; }
  .adm-cm-table-wrap { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; overflow: hidden; }
  .adm-cm-table { width: 100%; border-collapse: collapse; }
  .adm-cm-table th { padding: 0.7rem 1rem; font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35); text-transform: uppercase; letter-spacing: 0.08em; text-align: left; border-bottom: 1px solid rgba(170,69,245,0.07); background: rgba(255,255,255,0.01); white-space: nowrap; }
  .adm-cm-table td { padding: 0.8rem 1rem; font-size: 0.82rem; color: rgba(240,235,248,0.75); border-bottom: 1px solid rgba(170,69,245,0.05); vertical-align: middle; }
  .adm-cm-table tr:last-child td { border-bottom: none; }
  .adm-cm-table tr:hover td { background: rgba(170,69,245,0.025); }
  .adm-cm-content-cell { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adm-cm-btn { padding: 0.3rem 0.65rem; border-radius: 7px; border: none; cursor: pointer; font-size: 0.72rem; font-weight: 600; font-family: inherit; transition: opacity 0.15s; background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-cm-btn:hover { opacity: 0.85; }
  .adm-cm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-cm-empty { text-align: center; padding: 3rem; color: rgba(240,235,248,0.3); font-size: 0.85rem; }
  .adm-cm-loading { text-align: center; padding: 3rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
  .adm-cm-spinner { width: 18px; height: 18px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin4 0.7s linear infinite; }
  @keyframes adm-spin4 { to { transform: rotate(360deg); } }
  .adm-cm-pagination { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; border-top: 1px solid rgba(170,69,245,0.08); font-size: 0.78rem; color: rgba(240,235,248,0.4); }
  .adm-cm-page-btns { display: flex; gap: 0.35rem; }
  .adm-cm-page-btn { padding: 0.3rem 0.7rem; border-radius: 7px; border: 1px solid rgba(170,69,245,0.15); background: rgba(255,255,255,0.03); color: rgba(240,235,248,0.6); cursor: pointer; font-size: 0.78rem; font-family: inherit; transition: all 0.15s; }
  .adm-cm-page-btn:hover:not(:disabled) { border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-cm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-cm-page-btn-active { background: rgba(170,69,245,0.15); border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-cm-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.6rem 0.9rem; font-size: 0.8rem; color: #FCA5A5; }
`;

function formatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return v; }
}

function extractComments(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.comments)) return payload.comments;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

const PAGE_SIZE = 15;

export default function CommentsManagement() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      const res = await adminService.getComments(params);
      setComments(extractComments(res));
      setTotal(res?.total ?? res?.data?.total ?? extractComments(res).length);
    } catch (ex) {
      setError(ex.message || 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this comment? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await adminService.deleteComment(id);
      fetchComments();
    } catch (ex) {
      setError(ex.message || 'Failed to delete comment.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Comments Management">
        <div className="adm-cm-root">
          <div className="adm-cm-toolbar">
            <div className="adm-cm-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search comments…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {error && <div className="adm-cm-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="adm-cm-table-wrap">
            <table className="adm-cm-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Author</th>
                  <th>Post</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="adm-cm-loading"><div className="adm-cm-spinner" /> Loading comments…</div></td></tr>
                ) : comments.length === 0 ? (
                  <tr><td colSpan={5}><div className="adm-cm-empty">No comments found.</div></td></tr>
                ) : comments.map((c, i) => (
                  <tr key={c._id ?? c.id ?? i}>
                    <td className="adm-cm-content-cell">{c.content ?? c.text ?? c.body ?? '—'}</td>
                    <td>{c.author?.name ?? c.author?.username ?? c.userId ?? '—'}</td>
                    <td style={{ fontSize: '0.72rem', opacity: 0.5 }}>{c.postId ?? c.post?._id ?? '—'}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <button
                        className="adm-cm-btn"
                        disabled={deletingId === (c._id ?? c.id)}
                        onClick={() => handleDelete(c._id ?? c.id)}
                      >
                        {deletingId === (c._id ?? c.id) ? '…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="adm-cm-pagination">
              <span>Showing {comments.length} of {total} comments</span>
              <div className="adm-cm-page-btns">
                <button className="adm-cm-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pg > totalPages) return null;
                  return (
                    <button key={pg} className={`adm-cm-page-btn${pg === page ? ' adm-cm-page-btn-active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                  );
                })}
                <button className="adm-cm-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


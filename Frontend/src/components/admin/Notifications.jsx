import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-notif-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-notif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  @media (max-width: 768px) { .adm-notif-grid { grid-template-columns: 1fr; } }
  .adm-notif-panel { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; padding: 1.5rem; }
  .adm-notif-panel-title { font-size: 0.9rem; font-weight: 700; color: rgba(240,235,248,0.9); margin: 0 0 1.25rem; }
  .adm-notif-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
  .adm-notif-label { font-size: 0.75rem; font-weight: 600; color: rgba(240,235,248,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
  .adm-notif-input, .adm-notif-select, .adm-notif-textarea {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(170,69,245,0.15); border-radius: 9px;
    padding: 0.6rem 0.9rem; color: #F0EBF8; font-size: 0.85rem; font-family: inherit; outline: none;
    transition: border-color 0.2s, background 0.2s; box-sizing: border-box; width: 100%;
  }
  .adm-notif-input:focus, .adm-notif-select:focus, .adm-notif-textarea:focus {
    border-color: rgba(170,69,245,0.45); background: rgba(170,69,245,0.04);
  }
  .adm-notif-input::placeholder, .adm-notif-textarea::placeholder { color: rgba(240,235,248,0.2); }
  .adm-notif-textarea { resize: vertical; min-height: 100px; }
  .adm-notif-btn {
    width: 100%; padding: 0.7rem; background: linear-gradient(135deg, #AA45F5 0%, #8B2FD8 100%);
    border: none; border-radius: 9px; color: #fff; font-size: 0.85rem; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: opacity 0.2s; box-shadow: 0 4px 16px rgba(170,69,245,0.25);
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .adm-notif-btn:hover:not(:disabled) { opacity: 0.9; }
  .adm-notif-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .adm-notif-btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: adm-spin7 0.7s linear infinite; }
  @keyframes adm-spin7 { to { transform: rotate(360deg); } }
  .adm-notif-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); border-radius: 9px; padding: 0.7rem 1rem; font-size: 0.83rem; color: #4ADE80; margin-bottom: 1rem; }
  .adm-notif-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.7rem 1rem; font-size: 0.83rem; color: #FCA5A5; margin-bottom: 1rem; }
  .adm-notif-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .adm-notif-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(170,69,245,0.08); border-radius: 10px; padding: 0.85rem 1rem; }
  .adm-notif-item-title { font-size: 0.85rem; font-weight: 600; color: rgba(240,235,248,0.9); margin-bottom: 0.25rem; }
  .adm-notif-item-body { font-size: 0.78rem; color: rgba(240,235,248,0.55); line-height: 1.5; }
  .adm-notif-item-meta { font-size: 0.7rem; color: rgba(240,235,248,0.3); margin-top: 0.3rem; }
  .adm-notif-loading { text-align: center; padding: 2rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
  .adm-notif-spinner { width: 18px; height: 18px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin7 0.7s linear infinite; }
  .adm-notif-empty { text-align: center; padding: 2rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
`;

function formatDate(v) {
  if (!v) return '';
  try { return new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function extractNotifs(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  return [];
}

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [notifs, setNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    adminService.getNotifications({ limit: 20 })
      .then((res) => { setNotifs(extractNotifs(res)); setLoadingNotifs(false); })
      .catch(() => setLoadingNotifs(false));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) { setError('Title and message are required.'); return; }
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await adminService.sendNotification({ title: title.trim(), message: message.trim(), type, target });
      setSuccess('Notification sent successfully!');
      setTitle('');
      setMessage('');
      // Refresh list
      const res = await adminService.getNotifications({ limit: 20 });
      setNotifs(extractNotifs(res));
    } catch (ex) {
      setError(ex.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Notifications">
        <div className="adm-notif-root">
          <div className="adm-notif-grid">
            {/* Send Form */}
            <div className="adm-notif-panel">
              <h3 className="adm-notif-panel-title">Send Platform Notification</h3>
              {success && <div className="adm-notif-success">{success}</div>}
              {error && <div className="adm-notif-error">{error}</div>}
              <form onSubmit={handleSend}>
                <div className="adm-notif-field">
                  <label className="adm-notif-label">Title</label>
                  <input className="adm-notif-input" type="text" placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={sending} />
                </div>
                <div className="adm-notif-field">
                  <label className="adm-notif-label">Message</label>
                  <textarea className="adm-notif-textarea" placeholder="Write your message…" value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} />
                </div>
                <div className="adm-notif-field">
                  <label className="adm-notif-label">Type</label>
                  <select className="adm-notif-select" value={type} onChange={(e) => setType(e.target.value)} disabled={sending}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div className="adm-notif-field">
                  <label className="adm-notif-label">Target Audience</label>
                  <select className="adm-notif-select" value={target} onChange={(e) => setTarget(e.target.value)} disabled={sending}>
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="new">New Users (last 7 days)</option>
                  </select>
                </div>
                <button className="adm-notif-btn" type="submit" disabled={sending}>
                  {sending ? (
                    <><span className="adm-notif-btn-spinner" /> Sending…</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Send Notification
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Notifications */}
            <div className="adm-notif-panel">
              <h3 className="adm-notif-panel-title">Recent Notifications</h3>
              {loadingNotifs ? (
                <div className="adm-notif-loading"><div className="adm-notif-spinner" /> Loading…</div>
              ) : notifs.length === 0 ? (
                <div className="adm-notif-empty">No notifications sent yet.</div>
              ) : (
                <div className="adm-notif-list">
                  {notifs.map((n, i) => (
                    <div key={n._id ?? n.id ?? i} className="adm-notif-item">
                      <div className="adm-notif-item-title">{n.title ?? n.subject ?? 'Untitled'}</div>
                      <div className="adm-notif-item-body">{n.message ?? n.body ?? n.content ?? '—'}</div>
                      <div className="adm-notif-item-meta">
                        {n.type && <span style={{ color: '#AA45F5', marginRight: '0.5rem' }}>{n.type}</span>}
                        {formatDate(n.createdAt ?? n.sentAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


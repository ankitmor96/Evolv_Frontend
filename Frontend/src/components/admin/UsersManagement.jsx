import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-um-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-um-toolbar {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;
  }
  .adm-um-search {
    display: flex; align-items: center; gap: 0.5rem;
    background: #0D0A15; border: 1px solid rgba(170,69,245,0.15); border-radius: 10px;
    padding: 0.55rem 0.9rem; flex: 1; min-width: 180px; max-width: 320px;
  }
  .adm-um-search:focus-within { border-color: rgba(170,69,245,0.4); }
  .adm-um-search input { background: none; border: none; outline: none; color: #F0EBF8; font-size: 0.85rem; width: 100%; font-family: inherit; }
  .adm-um-search input::placeholder { color: rgba(240,235,248,0.25); }
  .adm-um-search svg { color: rgba(240,235,248,0.3); flex-shrink: 0; }
  .adm-um-select {
    background: #0D0A15; border: 1px solid rgba(170,69,245,0.15); border-radius: 10px;
    padding: 0.55rem 0.9rem; color: rgba(240,235,248,0.7); font-size: 0.83rem;
    font-family: inherit; outline: none; cursor: pointer;
  }
  .adm-um-select:focus { border-color: rgba(170,69,245,0.4); }
  .adm-um-table-wrap {
    background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; overflow: hidden;
  }
  .adm-um-table { width: 100%; border-collapse: collapse; }
  .adm-um-table th {
    padding: 0.7rem 1rem; font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35);
    text-transform: uppercase; letter-spacing: 0.08em; text-align: left;
    border-bottom: 1px solid rgba(170,69,245,0.07); background: rgba(255,255,255,0.01); white-space: nowrap;
  }
  .adm-um-table td {
    padding: 0.8rem 1rem; font-size: 0.82rem; color: rgba(240,235,248,0.75);
    border-bottom: 1px solid rgba(170,69,245,0.05); vertical-align: middle;
  }
  .adm-um-table tr:last-child td { border-bottom: none; }
  .adm-um-table tr:hover td { background: rgba(170,69,245,0.025); }
  .adm-um-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #AA45F5, #8B2FD8);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .adm-um-user-cell { display: flex; align-items: center; gap: 0.6rem; }
  .adm-um-user-info { display: flex; flex-direction: column; gap: 0.1rem; }
  .adm-um-user-name { font-weight: 600; color: rgba(240,235,248,0.9); font-size: 0.84rem; }
  .adm-um-user-username { font-size: 0.72rem; color: rgba(240,235,248,0.35); }
  .adm-um-tag {
    display: inline-flex; align-items: center; padding: 0.15rem 0.55rem;
    border-radius: 20px; font-size: 0.68rem; font-weight: 600;
  }
  .adm-um-tag-active { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-um-tag-suspended { background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-um-tag-inactive { background: rgba(255,255,255,0.07); color: rgba(240,235,248,0.4); }
  .adm-um-actions { display: flex; align-items: center; gap: 0.4rem; }
  .adm-um-btn {
    padding: 0.3rem 0.65rem; border-radius: 7px; border: none; cursor: pointer;
    font-size: 0.72rem; font-weight: 600; font-family: inherit; transition: opacity 0.15s, background 0.15s;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .adm-um-btn:hover { opacity: 0.85; }
  .adm-um-btn-view { background: rgba(170,69,245,0.15); color: #C084FC; }
  .adm-um-btn-suspend { background: rgba(245,158,11,0.12); color: #FCD34D; }
  .adm-um-btn-reactivate { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-um-btn-delete { background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-um-empty { text-align: center; padding: 3rem; color: rgba(240,235,248,0.3); font-size: 0.85rem; }
  .adm-um-loading {
    text-align: center; padding: 3rem; color: rgba(240,235,248,0.3); font-size: 0.82rem;
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  }
  .adm-um-spinner {
    width: 18px; height: 18px; border: 2px solid rgba(170,69,245,0.2);
    border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin 0.7s linear infinite;
  }
  @keyframes adm-spin { to { transform: rotate(360deg); } }
  .adm-um-pagination {
    display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem;
    border-top: 1px solid rgba(170,69,245,0.08); font-size: 0.78rem; color: rgba(240,235,248,0.4);
  }
  .adm-um-page-btns { display: flex; gap: 0.35rem; }
  .adm-um-page-btn {
    padding: 0.3rem 0.7rem; border-radius: 7px; border: 1px solid rgba(170,69,245,0.15);
    background: rgba(255,255,255,0.03); color: rgba(240,235,248,0.6);
    cursor: pointer; font-size: 0.78rem; font-family: inherit; transition: all 0.15s;
  }
  .adm-um-page-btn:hover:not(:disabled) { border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-um-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-um-page-btn-active { background: rgba(170,69,245,0.15); border-color: rgba(170,69,245,0.35); color: #C084FC; }
  /* Modal */
  .adm-um-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
    backdrop-filter: blur(4px);
  }
  .adm-um-modal {
    background: #0D0A15; border: 1px solid rgba(170,69,245,0.2); border-radius: 16px;
    padding: 1.5rem; max-width: 480px; width: 100%; max-height: 85vh; overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  }
  .adm-um-modal-title {
    font-size: 1rem; font-weight: 700; color: #F0EBF8; margin: 0 0 1rem;
    display: flex; align-items: center; justify-content: space-between;
  }
  .adm-um-modal-close {
    background: none; border: none; cursor: pointer; color: rgba(240,235,248,0.4);
    font-size: 1.2rem; padding: 0; transition: color 0.15s;
  }
  .adm-um-modal-close:hover { color: #F0EBF8; }
  .adm-um-modal-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 0.5rem 0; border-bottom: 1px solid rgba(170,69,245,0.06);
    font-size: 0.83rem;
  }
  .adm-um-modal-row:last-of-type { border-bottom: none; }
  .adm-um-modal-key { color: rgba(240,235,248,0.4); font-weight: 500; }
  .adm-um-modal-val { color: rgba(240,235,248,0.85); text-align: right; max-width: 60%; word-break: break-word; }
  .adm-um-modal-actions { display: flex; gap: 0.5rem; margin-top: 1.2rem; flex-wrap: wrap; }
  .adm-um-modal-btn {
    flex: 1; min-width: 100px; padding: 0.55rem 1rem; border-radius: 9px; border: none;
    cursor: pointer; font-size: 0.82rem; font-weight: 600; font-family: inherit;
    transition: opacity 0.15s;
  }
  .adm-um-modal-btn:hover { opacity: 0.85; }
  .adm-um-modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .adm-um-confirm-msg { font-size: 0.85rem; color: rgba(240,235,248,0.7); margin: 0.5rem 0 1rem; line-height: 1.5; }
  .adm-um-confirm-textarea {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(170,69,245,0.15);
    border-radius: 9px; padding: 0.6rem 0.8rem; color: #F0EBF8; font-size: 0.83rem;
    font-family: inherit; outline: none; resize: vertical; min-height: 70px; box-sizing: border-box;
    margin-bottom: 1rem;
  }
  .adm-um-confirm-textarea:focus { border-color: rgba(170,69,245,0.4); }
  .adm-um-error-toast {
    background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px;
    padding: 0.6rem 0.9rem; font-size: 0.8rem; color: #FCA5A5; margin-bottom: 0.75rem;
  }
`;

function formatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return v; }
}

function StatusTag({ status }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active') return <span className="adm-um-tag adm-um-tag-active">Active</span>;
  if (s === 'suspended' || s === 'banned') return <span className="adm-um-tag adm-um-tag-suspended">{status}</span>;
  return <span className="adm-um-tag adm-um-tag-inactive">{status || 'Unknown'}</span>;
}

function extractUsers(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function getInitials(u) {
  const name = u?.name ?? u?.username ?? u?.email ?? '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function UserDetailModal({ user, onClose, onAction }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const status = (user?.status ?? user?.accountStatus ?? 'active').toLowerCase();
  const isSuspended = status === 'suspended' || status === 'banned';

  const doAction = async (fn) => {
    setActionError('');
    setActionLoading(true);
    try { await fn(); onAction(); onClose(); }
    catch (ex) { setActionError(ex.message || 'Action failed.'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="adm-um-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-um-modal">
        <div className="adm-um-modal-title">
          User Details
          <button className="adm-um-modal-close" onClick={onClose}>✕</button>
        </div>
        {[
          ['Name', user?.name ?? '—'],
          ['Username', user?.username ?? '—'],
          ['Email', user?.email ?? '—'],
          ['Role', user?.role ?? 'user'],
          ['Status', <StatusTag key="s" status={user?.status ?? 'active'} />],
          ['Joined', formatDate(user?.createdAt ?? user?.joinedAt)],
          ['Posts', user?.postsCount ?? user?.posts ?? '—'],
          ['Connections', user?.connectionsCount ?? user?.connections ?? '—'],
          ['ID', <span key="id" style={{ fontSize: '0.72rem', opacity: 0.5 }}>{user?._id ?? user?.id ?? '—'}</span>],
        ].map(([k, v]) => (
          <div className="adm-um-modal-row" key={k}>
            <span className="adm-um-modal-key">{k}</span>
            <span className="adm-um-modal-val">{v}</span>
          </div>
        ))}
        {actionError && <div className="adm-um-error-toast" style={{ marginTop: '0.75rem' }}>{actionError}</div>}
        <div className="adm-um-modal-actions">
          {isSuspended ? (
            <button
              className="adm-um-modal-btn"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}
              disabled={actionLoading}
              onClick={() => doAction(() => adminService.reactivateUser(user._id ?? user.id))}
            >
              {actionLoading ? '…' : 'Reactivate'}
            </button>
          ) : (
            <button
              className="adm-um-modal-btn"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}
              disabled={actionLoading}
              onClick={() => doAction(() => adminService.suspendUser(user._id ?? user.id))}
            >
              {actionLoading ? '…' : 'Suspend'}
            </button>
          )}
          <button
            className="adm-um-modal-btn"
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

function ConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, requireReason }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try { await onConfirm(reason); }
    catch (ex) { setError(ex.message || 'Action failed.'); setLoading(false); }
  };

  return (
    <div className="adm-um-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="adm-um-modal" style={{ maxWidth: '380px' }}>
        <div className="adm-um-modal-title">
          {title}
          <button className="adm-um-modal-close" onClick={onCancel}>✕</button>
        </div>
        <p className="adm-um-confirm-msg">{message}</p>
        {requireReason && (
          <textarea
            className="adm-um-confirm-textarea"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        {error && <div className="adm-um-error-toast">{error}</div>}
        <div className="adm-um-modal-actions">
          <button className="adm-um-modal-btn" style={{ background: confirmColor + '22', color: confirmColor }} disabled={loading} onClick={handleConfirm}>
            {loading ? '…' : confirmLabel}
          </button>
          <button className="adm-um-modal-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,235,248,0.6)' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminService.getUsers(params);
      setUsers(extractUsers(res));
      setTotal(res?.total ?? res?.data?.total ?? extractUsers(res).length);
    } catch (ex) {
      setError(ex.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSuspend = (user) => {
    setConfirmAction({
      title: 'Suspend User',
      message: `Suspend ${user.name ?? user.email}? They will lose access to the platform.`,
      confirmLabel: 'Suspend',
      confirmColor: '#F59E0B',
      requireReason: true,
      fn: async (reason) => { await adminService.suspendUser(user._id ?? user.id, reason); fetchUsers(); },
    });
  };

  const handleReactivate = (user) => {
    setConfirmAction({
      title: 'Reactivate User',
      message: `Reactivate ${user.name ?? user.email}? They will regain access.`,
      confirmLabel: 'Reactivate',
      confirmColor: '#22C55E',
      requireReason: false,
      fn: async () => { await adminService.reactivateUser(user._id ?? user.id); fetchUsers(); },
    });
  };

  const handleDelete = (user) => {
    setConfirmAction({
      title: 'Delete User',
      message: `Permanently delete ${user.name ?? user.email}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: '#EF4444',
      requireReason: false,
      fn: async () => { await adminService.deleteUser(user._id ?? user.id); fetchUsers(); },
    });
  };

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Users Management">
        <div className="adm-um-root">
          <div className="adm-um-toolbar">
            <div className="adm-um-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="adm-um-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && <div className="adm-um-error-toast" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="adm-um-table-wrap">
            <table className="adm-um-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="adm-um-loading"><div className="adm-um-spinner" /> Loading users…</div></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5}><div className="adm-um-empty">No users found.</div></td></tr>
                ) : users.map((u, i) => {
                  const status = (u?.status ?? u?.accountStatus ?? 'active').toLowerCase();
                  const isSuspended = status === 'suspended' || status === 'banned';
                  return (
                    <tr key={u._id ?? u.id ?? i}>
                      <td>
                        <div className="adm-um-user-cell">
                          <div className="adm-um-avatar">{getInitials(u)}</div>
                          <div className="adm-um-user-info">
                            <span className="adm-um-user-name">{u.name ?? '—'}</span>
                            <span className="adm-um-user-username">@{u.username ?? 'unknown'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{u.email ?? '—'}</td>
                      <td>{formatDate(u.createdAt ?? u.joinedAt)}</td>
                      <td><StatusTag status={u.status ?? u.accountStatus ?? 'active'} /></td>
                      <td>
                        <div className="adm-um-actions">
                          <button className="adm-um-btn adm-um-btn-view" onClick={() => setSelectedUser(u)}>View</button>
                          {isSuspended ? (
                            <button className="adm-um-btn adm-um-btn-reactivate" onClick={() => handleReactivate(u)}>Reactivate</button>
                          ) : (
                            <button className="adm-um-btn adm-um-btn-suspend" onClick={() => handleSuspend(u)}>Suspend</button>
                          )}
                          <button className="adm-um-btn adm-um-btn-delete" onClick={() => handleDelete(u)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="adm-um-pagination">
              <span>Showing {users.length} of {total} users</span>
              <div className="adm-um-page-btns">
                <button className="adm-um-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      className={`adm-um-page-btn${pg === page ? ' adm-um-page-btn-active' : ''}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button className="adm-um-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          </div>
        </div>

        {selectedUser && (
          <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={fetchUsers} />
        )}

        {confirmAction && (
          <ConfirmModal
            title={confirmAction.title}
            message={confirmAction.message}
            confirmLabel={confirmAction.confirmLabel}
            confirmColor={confirmAction.confirmColor}
            requireReason={confirmAction.requireReason}
            onConfirm={async (reason) => { await confirmAction.fn(reason); setConfirmAction(null); }}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


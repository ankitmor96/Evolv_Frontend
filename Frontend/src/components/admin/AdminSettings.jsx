import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-set-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-set-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  @media (max-width: 768px) { .adm-set-grid { grid-template-columns: 1fr; } }
  .adm-set-panel { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; padding: 1.5rem; }
  .adm-set-panel-title { font-size: 0.9rem; font-weight: 700; color: rgba(240,235,248,0.9); margin: 0 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(170,69,245,0.08); }
  .adm-set-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
  .adm-set-label { font-size: 0.75rem; font-weight: 600; color: rgba(240,235,248,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
  .adm-set-input, .adm-set-textarea {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(170,69,245,0.15); border-radius: 9px;
    padding: 0.6rem 0.9rem; color: #F0EBF8; font-size: 0.85rem; font-family: inherit; outline: none;
    transition: border-color 0.2s, background 0.2s; box-sizing: border-box; width: 100%;
  }
  .adm-set-input:focus, .adm-set-textarea:focus { border-color: rgba(170,69,245,0.45); background: rgba(170,69,245,0.04); }
  .adm-set-input::placeholder, .adm-set-textarea::placeholder { color: rgba(240,235,248,0.2); }
  .adm-set-input-wrap { position: relative; }
  .adm-set-toggle-pw { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(240,235,248,0.4); padding: 0.2rem; display: flex; align-items: center; transition: color 0.2s; }
  .adm-set-toggle-pw:hover { color: #AA45F5; }
  .adm-set-btn { width: 100%; padding: 0.65rem; background: linear-gradient(135deg, #AA45F5 0%, #8B2FD8 100%); border: none; border-radius: 9px; color: #fff; font-size: 0.85rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: opacity 0.2s; box-shadow: 0 4px 16px rgba(170,69,245,0.2); }
  .adm-set-btn:hover:not(:disabled) { opacity: 0.9; }
  .adm-set-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .adm-set-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); border-radius: 9px; padding: 0.65rem 0.9rem; font-size: 0.82rem; color: #4ADE80; margin-bottom: 1rem; }
  .adm-set-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.65rem 0.9rem; font-size: 0.82rem; color: #FCA5A5; margin-bottom: 1rem; }
  .adm-set-profile-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
  .adm-set-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #AA45F5, #8B2FD8); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; color: #fff; flex-shrink: 0; }
  .adm-set-profile-info { flex: 1; }
  .adm-set-profile-name { font-size: 1rem; font-weight: 700; color: rgba(240,235,248,0.9); }
  .adm-set-profile-role { font-size: 0.78rem; color: rgba(170,69,245,0.8); font-weight: 500; margin-top: 0.15rem; }
  .adm-set-profile-email { font-size: 0.8rem; color: rgba(240,235,248,0.4); margin-top: 0.1rem; }
  .adm-set-info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0; border-bottom: 1px solid rgba(170,69,245,0.06); font-size: 0.82rem; }
  .adm-set-info-row:last-child { border-bottom: none; }
  .adm-set-info-key { color: rgba(240,235,248,0.4); font-weight: 500; }
  .adm-set-info-val { color: rgba(240,235,248,0.8); }
  .adm-set-audit-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 340px; overflow-y: auto; }
  .adm-set-audit-list::-webkit-scrollbar { width: 4px; }
  .adm-set-audit-list::-webkit-scrollbar-thumb { background: rgba(170,69,245,0.2); border-radius: 4px; }
  .adm-set-audit-item { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.65rem 0.9rem; }
  .adm-set-audit-action { font-size: 0.8rem; font-weight: 600; color: rgba(240,235,248,0.85); }
  .adm-set-audit-meta { font-size: 0.7rem; color: rgba(240,235,248,0.35); margin-top: 0.2rem; }
  .adm-set-loading { text-align: center; padding: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: rgba(240,235,248,0.3); font-size: 0.8rem; }
  .adm-set-spinner { width: 16px; height: 16px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin8 0.7s linear infinite; }
  @keyframes adm-spin8 { to { transform: rotate(360deg); } }
  .adm-set-empty { text-align: center; padding: 1.5rem; color: rgba(240,235,248,0.3); font-size: 0.8rem; }
  .adm-set-full { grid-column: 1 / -1; }
`;

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function formatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return v; }
}

function extractLogs(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.logs)) return payload.logs;
  if (Array.isArray(payload.auditLogs)) return payload.auditLogs;
  return [];
}

export default function AdminSettings() {
  const user = adminService.getAdminUser();
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  // Change password
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // Audit logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Platform config
  const [config, setConfig] = useState(null);

  useEffect(() => {
    adminService.getAuditLogs({ limit: 20 }).then((res) => { setLogs(extractLogs(res)); setLogsLoading(false); }).catch(() => setLogsLoading(false));
    adminService.getPlatformConfig().then(setConfig).catch(() => {});
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!curPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await adminService.changePassword(curPw, newPw);
      setPwSuccess('Password changed successfully!');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (ex) {
      setPwError(ex.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Settings">
        <div className="adm-set-root">
          <div className="adm-set-grid">
            {/* Admin Profile */}
            <div className="adm-set-panel">
              <h3 className="adm-set-panel-title">Admin Profile</h3>
              <div className="adm-set-profile-row">
                <div className="adm-set-avatar">{initials}</div>
                <div className="adm-set-profile-info">
                  <div className="adm-set-profile-name">{user?.name || 'Administrator'}</div>
                  <div className="adm-set-profile-role">Administrator</div>
                  <div className="adm-set-profile-email">{user?.email || '—'}</div>
                </div>
              </div>
              {[
                ['User ID', user?.id ?? '—'],
                ['Role', user?.role ?? 'admin'],
                ['Email', user?.email ?? '—'],
                ['Name', user?.name ?? '—'],
              ].map(([k, v]) => (
                <div className="adm-set-info-row" key={k}>
                  <span className="adm-set-info-key">{k}</span>
                  <span className="adm-set-info-val" style={{ fontSize: '0.8rem' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Change Password */}
            <div className="adm-set-panel">
              <h3 className="adm-set-panel-title">Change Password</h3>
              {pwSuccess && <div className="adm-set-success">{pwSuccess}</div>}
              {pwError && <div className="adm-set-error">{pwError}</div>}
              <form onSubmit={handleChangePassword}>
                {[
                  { label: 'Current Password', val: curPw, setter: setCurPw, show: showCur, setShow: setShowCur },
                  { label: 'New Password', val: newPw, setter: setNewPw, show: showNew, setShow: setShowNew },
                  { label: 'Confirm New Password', val: confirmPw, setter: setConfirmPw, show: showConf, setShow: setShowConf },
                ].map(({ label, val, setter, show, setShow }) => (
                  <div className="adm-set-field" key={label}>
                    <label className="adm-set-label">{label}</label>
                    <div className="adm-set-input-wrap">
                      <input
                        className="adm-set-input"
                        type={show ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                        disabled={pwLoading}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button type="button" className="adm-set-toggle-pw" onClick={() => setShow((s) => !s)} tabIndex={-1}>
                        <EyeIcon open={show} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="adm-set-btn" type="submit" disabled={pwLoading}>
                  {pwLoading ? 'Changing…' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Platform Config (if available) */}
            {config && (
              <div className="adm-set-panel">
                <h3 className="adm-set-panel-title">Platform Configuration</h3>
                {Object.entries(config?.data ?? config ?? {})
                  .filter(([, v]) => typeof v !== 'object')
                  .slice(0, 10)
                  .map(([k, v]) => (
                    <div className="adm-set-info-row" key={k}>
                      <span className="adm-set-info-key">{k}</span>
                      <span className="adm-set-info-val">{String(v)}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Audit Logs */}
            <div className={`adm-set-panel${!config ? ' adm-set-full' : ''}`}>
              <h3 className="adm-set-panel-title">Audit Logs</h3>
              {logsLoading ? (
                <div className="adm-set-loading"><div className="adm-set-spinner" /> Loading logs…</div>
              ) : logs.length === 0 ? (
                <div className="adm-set-empty">No audit logs available.</div>
              ) : (
                <div className="adm-set-audit-list">
                  {logs.map((log, i) => (
                    <div key={log._id ?? log.id ?? i} className="adm-set-audit-item">
                      <div className="adm-set-audit-action">{log.action ?? log.event ?? log.type ?? 'Unknown Action'}</div>
                      <div className="adm-set-audit-meta">
                        {log.admin ?? log.performedBy ?? log.user ?? 'Admin'} · {formatDate(log.createdAt ?? log.timestamp)}
                        {log.details && <span style={{ marginLeft: '0.5rem', color: 'rgba(240,235,248,0.25)' }}>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details).slice(0, 60)}</span>}
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


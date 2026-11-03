import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-rm-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-rm-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .adm-rm-select { background: #0D0A15; border: 1px solid rgba(170,69,245,0.15); border-radius: 10px; padding: 0.55rem 0.9rem; color: rgba(240,235,248,0.7); font-size: 0.83rem; font-family: inherit; outline: none; cursor: pointer; }
  .adm-rm-table-wrap { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; overflow: hidden; }
  .adm-rm-table { width: 100%; border-collapse: collapse; }
  .adm-rm-table th { padding: 0.7rem 1rem; font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35); text-transform: uppercase; letter-spacing: 0.08em; text-align: left; border-bottom: 1px solid rgba(170,69,245,0.07); background: rgba(255,255,255,0.01); white-space: nowrap; }
  .adm-rm-table td { padding: 0.8rem 1rem; font-size: 0.82rem; color: rgba(240,235,248,0.75); border-bottom: 1px solid rgba(170,69,245,0.05); vertical-align: middle; }
  .adm-rm-table tr:last-child td { border-bottom: none; }
  .adm-rm-table tr:hover td { background: rgba(170,69,245,0.025); }
  .adm-rm-tag { display: inline-flex; align-items: center; padding: 0.15rem 0.55rem; border-radius: 20px; font-size: 0.68rem; font-weight: 600; }
  .adm-rm-tag-pending { background: rgba(245,158,11,0.12); color: #FCD34D; }
  .adm-rm-tag-resolved { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-rm-tag-dismissed { background: rgba(255,255,255,0.07); color: rgba(240,235,248,0.4); }
  .adm-rm-actions { display: flex; align-items: center; gap: 0.4rem; }
  .adm-rm-btn { padding: 0.3rem 0.65rem; border-radius: 7px; border: none; cursor: pointer; font-size: 0.72rem; font-weight: 600; font-family: inherit; transition: opacity 0.15s; }
  .adm-rm-btn:hover { opacity: 0.85; }
  .adm-rm-btn-review { background: rgba(170,69,245,0.15); color: #C084FC; }
  .adm-rm-btn-resolve { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-rm-btn-dismiss { background: rgba(255,255,255,0.07); color: rgba(240,235,248,0.45); }
  .adm-rm-empty { text-align: center; padding: 3rem; color: rgba(240,235,248,0.3); font-size: 0.85rem; }
  .adm-rm-loading { text-align: center; padding: 3rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
  .adm-rm-spinner { width: 18px; height: 18px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin3 0.7s linear infinite; }
  @keyframes adm-spin3 { to { transform: rotate(360deg); } }
  .adm-rm-pagination { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; border-top: 1px solid rgba(170,69,245,0.08); font-size: 0.78rem; color: rgba(240,235,248,0.4); }
  .adm-rm-page-btns { display: flex; gap: 0.35rem; }
  .adm-rm-page-btn { padding: 0.3rem 0.7rem; border-radius: 7px; border: 1px solid rgba(170,69,245,0.15); background: rgba(255,255,255,0.03); color: rgba(240,235,248,0.6); cursor: pointer; font-size: 0.78rem; font-family: inherit; transition: all 0.15s; }
  .adm-rm-page-btn:hover:not(:disabled) { border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-rm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-rm-page-btn-active { background: rgba(170,69,245,0.15); border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-rm-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); }
  .adm-rm-modal { background: #0D0A15; border: 1px solid rgba(170,69,245,0.2); border-radius: 16px; padding: 1.5rem; max-width: 480px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
  .adm-rm-modal-title { font-size: 1rem; font-weight: 700; color: #F0EBF8; margin: 0 0 1rem; display: flex; align-items: center; justify-content: space-between; }
  .adm-rm-modal-close { background: none; border: none; cursor: pointer; color: rgba(240,235,248,0.4); font-size: 1.2rem; padding: 0; transition: color 0.15s; }
  .adm-rm-modal-close:hover { color: #F0EBF8; }
  .adm-rm-modal-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.5rem 0; border-bottom: 1px solid rgba(170,69,245,0.06); font-size: 0.83rem; }
  .adm-rm-modal-key { color: rgba(240,235,248,0.4); font-weight: 500; }
  .adm-rm-modal-val { color: rgba(240,235,248,0.85); text-align: right; max-width: 60%; word-break: break-word; }
  .adm-rm-modal-actions { display: flex; gap: 0.5rem; margin-top: 1.2rem; flex-wrap: wrap; }
  .adm-rm-modal-btn { flex: 1; min-width: 100px; padding: 0.55rem 1rem; border-radius: 9px; border: none; cursor: pointer; font-size: 0.82rem; font-weight: 600; font-family: inherit; transition: opacity 0.15s; }
  .adm-rm-modal-btn:hover { opacity: 0.85; }
  .adm-rm-modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .adm-rm-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 9px; padding: 0.6rem 0.9rem; font-size: 0.8rem; color: #FCA5A5; margin-bottom: 0.75rem; }
`;

function formatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return v; }
}

function StatusTag({ status }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'pending') return <span className="adm-rm-tag adm-rm-tag-pending">Pending</span>;
  if (s === 'resolved') return <span className="adm-rm-tag adm-rm-tag-resolved">Resolved</span>;
  return <span className="adm-rm-tag adm-rm-tag-dismissed">{status || 'Dismissed'}</span>;
}

function extractReports(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.reports)) return payload.reports;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function ReportDetailModal({ report, onClose, onResolve, onDismiss }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isPending = (report?.status ?? 'pending').toLowerCase() === 'pending';

  const doAction = async (fn) => {
    setError('');
    setLoading(true);
    try { await fn(); onClose(); }
    catch (ex) { setError(ex.message || 'Action failed.'); setLoading(false); }
  };

  return (
    <div className="adm-rm-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-rm-modal">
        <div className="adm-rm-modal-title">
          Report Details
          <button className="adm-rm-modal-close" onClick={onClose}>✕</button>
        </div>
        {[
          ['Report ID', <span key="id" style={{ fontSize: '0.72rem', opacity: 0.5 }}>{report?._id ?? report?.id ?? '—'}</span>],
          ['Reason', report?.reason ?? report?.type ?? '—'],
          ['Description', report?.description ?? report?.details ?? '—'],
          ['Reporter', report?.reporter?.name ?? report?.reporter?.email ?? report?.reportedBy ?? '—'],
          ['Target Type', report?.targetType ?? report?.contentType ?? '—'],
          ['Target ID', <span key="tid" style={{ fontSize: '0.72rem', opacity: 0.5 }}>{report?.targetId ?? report?.contentId ?? '—'}</span>],
          ['Status', <StatusTag key="s" status={report?.status ?? 'pending'} />],
          ['Reported At', formatDate(report?.createdAt)],
        ].map(([k, v]) => (
          <div className="adm-rm-modal-row" key={k}>
            <span className="adm-rm-modal-key">{k}</span>
            <span className="adm-rm-modal-val">{v}</span>
          </div>
        ))}
        {error && <div className="adm-rm-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        {isPending && (
          <div className="adm-rm-modal-actions">
            <button
              className="adm-rm-modal-btn"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}
              disabled={loading}
              onClick={() => doAction(() => onResolve(report._id ?? report.id))}
            >
              {loading ? '…' : 'Resolve'}
            </button>
            <button
              className="adm-rm-modal-btn"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(240,235,248,0.5)' }}
              disabled={loading}
              onClick={() => doAction(() => onDismiss(report._id ?? report.id))}
            >
              {loading ? '…' : 'Dismiss'}
            </button>
          </div>
        )}
        <div style={{ marginTop: isPending ? '0.5rem' : '1.2rem' }}>
          <button
            className="adm-rm-modal-btn"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'rgba(240,235,248,0.6)' }}
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

export default function ReportsManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      const res = await adminService.getReports(params);
      setReports(extractReports(res));
      setTotal(res?.total ?? res?.data?.total ?? extractReports(res).length);
    } catch (ex) {
      setError(ex.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleResolve = async (id) => {
    await adminService.resolveReport(id);
    fetchReports();
  };

  const handleDismiss = async (id) => {
    await adminService.dismissReport(id);
    fetchReports();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Reports Management">
        <div className="adm-rm-root">
          <div className="adm-rm-toolbar">
            <select className="adm-rm-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Reports</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {error && <div className="adm-rm-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="adm-rm-table-wrap">
            <table className="adm-rm-table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Target Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><div className="adm-rm-loading"><div className="adm-rm-spinner" /> Loading reports…</div></td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={6}><div className="adm-rm-empty">No reports found.</div></td></tr>
                ) : reports.map((r, i) => {
                  const isPending = (r?.status ?? 'pending').toLowerCase() === 'pending';
                  return (
                    <tr key={r._id ?? r.id ?? i}>
                      <td style={{ fontWeight: 500 }}>{r.reason ?? r.type ?? '—'}</td>
                      <td>{r.reporter?.name ?? r.reporter?.email ?? r.reportedBy ?? '—'}</td>
                      <td>{r.targetType ?? r.contentType ?? '—'}</td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td><StatusTag status={r.status ?? 'pending'} /></td>
                      <td>
                        <div className="adm-rm-actions">
                          <button className="adm-rm-btn adm-rm-btn-review" onClick={() => setSelectedReport(r)}>Review</button>
                          {isPending && (
                            <>
                              <button className="adm-rm-btn adm-rm-btn-resolve" onClick={() => handleResolve(r._id ?? r.id)}>Resolve</button>
                              <button className="adm-rm-btn adm-rm-btn-dismiss" onClick={() => handleDismiss(r._id ?? r.id)}>Dismiss</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="adm-rm-pagination">
              <span>Showing {reports.length} of {total} reports</span>
              <div className="adm-rm-page-btns">
                <button className="adm-rm-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pg > totalPages) return null;
                  return (
                    <button key={pg} className={`adm-rm-page-btn${pg === page ? ' adm-rm-page-btn-active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                  );
                })}
                <button className="adm-rm-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          </div>
        </div>

        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            onClose={() => { setSelectedReport(null); fetchReports(); }}
            onResolve={handleResolve}
            onDismiss={handleDismiss}
          />
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-conn-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-conn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .adm-conn-card { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; padding: 1.25rem; transition: border-color 0.2s; }
  .adm-conn-card:hover { border-color: rgba(170,69,245,0.25); }
  .adm-conn-card-label { font-size: 0.72rem; font-weight: 600; color: rgba(240,235,248,0.4); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
  .adm-conn-card-value { font-size: 2rem; font-weight: 800; color: #AA45F5; line-height: 1; }
  .adm-conn-card-sub { font-size: 0.72rem; color: rgba(240,235,248,0.3); margin-top: 0.3rem; }
  .adm-conn-section { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; padding: 1.5rem; }
  .adm-conn-section-title { font-size: 0.9rem; font-weight: 700; color: rgba(240,235,248,0.9); margin: 0 0 1.25rem; }
  .adm-conn-table { width: 100%; border-collapse: collapse; }
  .adm-conn-table th { padding: 0.5rem 0.75rem; font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35); text-transform: uppercase; letter-spacing: 0.08em; text-align: left; border-bottom: 1px solid rgba(170,69,245,0.07); }
  .adm-conn-table td { padding: 0.65rem 0.75rem; font-size: 0.82rem; color: rgba(240,235,248,0.7); border-bottom: 1px solid rgba(170,69,245,0.05); }
  .adm-conn-table tr:last-child td { border-bottom: none; }
  .adm-conn-loading { text-align: center; padding: 3rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
  .adm-conn-spinner { width: 20px; height: 20px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin5 0.7s linear infinite; }
  @keyframes adm-spin5 { to { transform: rotate(360deg); } }
  .adm-conn-empty { text-align: center; padding: 2rem; color: rgba(240,235,248,0.3); font-size: 0.85rem; }
  .adm-conn-raw { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 1rem; font-size: 0.78rem; font-family: monospace; color: rgba(240,235,248,0.6); white-space: pre-wrap; word-break: break-word; max-height: 400px; overflow-y: auto; margin-top: 1rem; }
`;

function StatCard({ label, value, sub }) {
  return (
    <div className="adm-conn-card">
      <div className="adm-conn-card-label">{label}</div>
      <div className="adm-conn-card-value">{value ?? '—'}</div>
      {sub && <div className="adm-conn-card-sub">{sub}</div>}
    </div>
  );
}

function extractValue(data, ...keys) {
  for (const k of keys) {
    if (data?.[k] !== undefined) return data[k];
    if (data?.data?.[k] !== undefined) return data.data[k];
  }
  return null;
}

export default function ConnectionsManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getConnectionStats()
      .then((res) => { setData(res); setLoading(false); })
      .catch((ex) => { setError(ex.message || 'Failed to load connection data.'); setLoading(false); });
  }, []);

  const raw = data?.data ?? data;

  const totalConnections = extractValue(data, 'totalConnections', 'total', 'connections');
  const pendingConnections = extractValue(data, 'pendingConnections', 'pending');
  const acceptedConnections = extractValue(data, 'acceptedConnections', 'accepted');
  const avgPerUser = extractValue(data, 'avgConnectionsPerUser', 'average', 'avg');

  // Try to get a list of recent connections
  const recentConnections = Array.isArray(raw?.recent)
    ? raw.recent
    : Array.isArray(raw?.connections)
    ? raw.connections.slice(0, 10)
    : [];

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Connections">
        <div className="adm-conn-root">
          {loading ? (
            <div className="adm-conn-loading"><div className="adm-conn-spinner" /> Loading connection data…</div>
          ) : error ? (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '1rem', color: '#FCA5A5', fontSize: '0.85rem' }}>{error}</div>
          ) : data === null ? (
            <div className="adm-conn-empty">Connection statistics are not available yet.</div>
          ) : (
            <>
              <div className="adm-conn-grid">
                <StatCard label="Total Connections" value={totalConnections} sub="All time" />
                <StatCard label="Pending" value={pendingConnections} sub="Awaiting acceptance" />
                <StatCard label="Accepted" value={acceptedConnections} sub="Active connections" />
                <StatCard label="Avg per User" value={avgPerUser !== null ? Number(avgPerUser).toFixed(1) : null} sub="Connections per user" />
              </div>

              {recentConnections.length > 0 && (
                <div className="adm-conn-section">
                  <h3 className="adm-conn-section-title">Recent Connections</h3>
                  <table className="adm-conn-table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentConnections.map((c, i) => (
                        <tr key={c._id ?? c.id ?? i}>
                          <td>{c.from?.name ?? c.sender?.name ?? c.fromUser ?? '—'}</td>
                          <td>{c.to?.name ?? c.receiver?.name ?? c.toUser ?? '—'}</td>
                          <td>{c.status ?? 'accepted'}</td>
                          <td>
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {recentConnections.length === 0 && (
                <div className="adm-conn-section">
                  <h3 className="adm-conn-section-title">Raw Statistics</h3>
                  <div className="adm-conn-raw">{JSON.stringify(raw, null, 2)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


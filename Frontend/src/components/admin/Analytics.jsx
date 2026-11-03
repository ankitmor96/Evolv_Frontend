import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-an-root { color: #F0EBF8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .adm-an-period-bar { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1.5rem; }
  .adm-an-period-btn { padding: 0.35rem 0.85rem; border-radius: 8px; border: 1px solid rgba(170,69,245,0.15); background: rgba(255,255,255,0.03); color: rgba(240,235,248,0.55); cursor: pointer; font-size: 0.8rem; font-weight: 500; font-family: inherit; transition: all 0.15s; }
  .adm-an-period-btn:hover { border-color: rgba(170,69,245,0.35); color: #C084FC; }
  .adm-an-period-btn-active { background: rgba(170,69,245,0.15); border-color: rgba(170,69,245,0.4); color: #C084FC; }
  .adm-an-section { background: #0D0A15; border: 1px solid rgba(170,69,245,0.12); border-radius: 14px; overflow: hidden; margin-bottom: 1.25rem; }
  .adm-an-section-header { padding: 1rem 1.25rem; border-bottom: 1px solid rgba(170,69,245,0.08); }
  .adm-an-section-title { font-size: 0.88rem; font-weight: 700; color: rgba(240,235,248,0.9); margin: 0; }
  .adm-an-chart-wrap { padding: 1.25rem; overflow-x: auto; }
  .adm-an-chart-svg { width: 100%; min-width: 280px; }
  .adm-an-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; padding: 1.25rem; }
  .adm-an-stat { background: rgba(255,255,255,0.025); border-radius: 10px; padding: 1rem; }
  .adm-an-stat-label { font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem; }
  .adm-an-stat-value { font-size: 1.6rem; font-weight: 800; color: #AA45F5; }
  .adm-an-loading { text-align: center; padding: 3rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(240,235,248,0.3); font-size: 0.82rem; }
  .adm-an-spinner { width: 20px; height: 20px; border: 2px solid rgba(170,69,245,0.2); border-top-color: #AA45F5; border-radius: 50%; animation: adm-spin6 0.7s linear infinite; }
  @keyframes adm-spin6 { to { transform: rotate(360deg); } }
  .adm-an-empty { text-align: center; padding: 2.5rem; color: rgba(240,235,248,0.3); font-size: 0.85rem; }
  .adm-an-raw { background: rgba(255,255,255,0.025); border-radius: 10px; padding: 1rem; font-size: 0.75rem; font-family: monospace; color: rgba(240,235,248,0.55); white-space: pre-wrap; word-break: break-word; max-height: 300px; overflow-y: auto; margin: 0 1.25rem 1.25rem; }
  .adm-an-table { width: 100%; border-collapse: collapse; }
  .adm-an-table th { padding: 0.6rem 1.25rem; font-size: 0.7rem; font-weight: 600; color: rgba(240,235,248,0.35); text-transform: uppercase; letter-spacing: 0.08em; text-align: left; border-bottom: 1px solid rgba(170,69,245,0.07); }
  .adm-an-table td { padding: 0.65rem 1.25rem; font-size: 0.82rem; color: rgba(240,235,248,0.7); border-bottom: 1px solid rgba(170,69,245,0.05); }
  .adm-an-table tr:last-child td { border-bottom: none; }
`;

function BarChart({ data, color = '#AA45F5' }) {
  if (!data || data.length === 0) return <div className="adm-an-empty">No data for this period</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 600; const h = 160; const padBottom = 30; const padTop = 10;
  const chartH = h - padBottom - padTop;
  const barW = Math.floor((w / data.length) * 0.5);
  const gap = Math.floor(w / data.length);
  return (
    <div className="adm-an-chart-wrap">
      <svg className="adm-an-chart-svg" viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="anBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * chartH);
          const x = i * gap + (gap - barW) / 2;
          const y = padTop + chartH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill="url(#anBarGrad)" />
              <text x={x + barW / 2} y={h - 8} textAnchor="middle" fill="rgba(240,235,248,0.35)" fontSize="10">{d.label}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="rgba(240,235,248,0.6)" fontSize="9">{d.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function parseAnalytics(raw, period) {
  if (!raw) return null;
  const d = raw?.data ?? raw;
  // Try to find array data
  const candidates = [d?.daily, d?.weekly, d?.monthly, d?.data, d?.items, d?.points];
  for (const arr of candidates) {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.slice(-14).map((item, idx) => ({
        label: item.date?.slice(5) ?? item.day ?? item.week ?? item.month ?? item.label ?? String(idx + 1),
        value: item.count ?? item.users ?? item.posts ?? item.value ?? 0,
      }));
    }
  }
  // Try top-level numeric keys
  const entries = Object.entries(d).filter(([, v]) => typeof v === 'number');
  if (entries.length > 0) {
    return entries.slice(0, 12).map(([k, v]) => ({ label: k, value: v }));
  }
  return null;
}

function extractTopStats(raw) {
  const d = raw?.data ?? raw;
  const stats = [];
  const map = {
    totalUsers: 'Total Users', users: 'Users', totalPosts: 'Total Posts', posts: 'Posts',
    activeUsers: 'Active Users', newUsers: 'New Users', newPosts: 'New Posts',
    engagement: 'Engagement', interactions: 'Interactions',
  };
  for (const [key, label] of Object.entries(map)) {
    if (d?.[key] !== undefined) stats.push({ label, value: d[key] });
  }
  return stats;
}

export default function Analytics() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminService.getAnalytics(period).then((r) => { setData(r); setLoading(false); }).catch(() => { setData(null); setLoading(false); });
  }, [period]);

  const chartData = parseAnalytics(data, period);
  const topStats = extractTopStats(data);
  const raw = data?.data ?? data;
  const hasData = data !== null;

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Analytics">
        <div className="adm-an-root">
          <div className="adm-an-period-bar">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button key={p} className={`adm-an-period-btn${period === p ? ' adm-an-period-btn-active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="adm-an-loading"><div className="adm-an-spinner" /> Loading analytics…</div>
          ) : !hasData ? (
            <div className="adm-an-section"><div className="adm-an-empty">Analytics data is not available. The backend may not yet support this endpoint.</div></div>
          ) : (
            <>
              {topStats.length > 0 && (
                <div className="adm-an-section">
                  <div className="adm-an-section-header"><h3 className="adm-an-section-title">Key Metrics</h3></div>
                  <div className="adm-an-stat-grid">
                    {topStats.map(({ label, value }) => (
                      <div key={label} className="adm-an-stat">
                        <div className="adm-an-stat-label">{label}</div>
                        <div className="adm-an-stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="adm-an-section">
                <div className="adm-an-section-header"><h3 className="adm-an-section-title">Growth Chart — {period.charAt(0).toUpperCase() + period.slice(1)}</h3></div>
                {chartData ? (
                  <BarChart data={chartData} />
                ) : (
                  <>
                    <div className="adm-an-empty">Chart data not in expected format — showing raw data below.</div>
                    <div className="adm-an-raw">{JSON.stringify(raw, null, 2)}</div>
                  </>
                )}
              </div>

              {chartData && (
                <div className="adm-an-section">
                  <div className="adm-an-section-header"><h3 className="adm-an-section-title">Data Table</h3></div>
                  <table className="adm-an-table">
                    <thead><tr><th>Period</th><th>Value</th></tr></thead>
                    <tbody>
                      {chartData.map((row, i) => (
                        <tr key={i}><td>{row.label}</td><td>{row.value.toLocaleString()}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


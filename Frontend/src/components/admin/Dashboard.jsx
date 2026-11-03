import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminProtectedRoute from './AdminProtectedRoute.jsx';
import { adminService } from '../../services/adminService.js';

const styles = `
/* ===== DASHBOARD LIGHT THEME TEXT FIX ===== */


.adm-dash-card,
.adm-dash-section {
background: #FFFFFF !important;
border: 1px solid #E8E3EF !important;
}

/* Stat card labels */
.adm-dash-card-label {
color: #71677E !important;
}

/* Stat numbers */
.adm-dash-card-value {
color: #963BE0;
}

/* Stat descriptions */
.adm-dash-card-sub {
color: #81788D !important;
}

/* Section headings */
.adm-dash-section-title {
color: #211B2B !important;
}

/* Table headings */
.adm-dash-table th {
color: #71677E !important;
background: #F8F6FB !important;
border-bottom: 1px solid #E8E3EF !important;
}

/* Table content */
.adm-dash-table td {
color: #51485D !important;
border-bottom: 1px solid #F0ECF4 !important;
}

/* User name inline color override */
.adm-dash-table td[style] {
color: #211B2B !important;
}

/* Empty messages */
.adm-dash-empty {
color: #81788D !important;
background: #FFFFFF;
}

/* Loading message */
.adm-dash-loading {
color: #81788D !important;
}

/* Chart labels and values */
.adm-dash-chart-svg text {
fill: #71677E !important;
}

/* Table empty row */
.adm-dash-table tbody td {
background: #FFFFFF;
}

/* Hover */
.adm-dash-table tr:hover td {
background: #F8F3FC !important;
}

/* Default status tag */
.adm-dash-tag:not(.adm-dash-tag-active):not(.adm-dash-tag-suspended):not(.adm-dash-tag-pending):not(.adm-dash-tag-removed) {
background: #F0ECF4 !important;
color: #62576F !important;
}
    .adm-dash-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .adm-dash-card {
    background: #0D0A15;
    border: 1px solid rgba(170,69,245,0.12);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .adm-dash-card:hover {
    border-color: rgba(170,69,245,0.25);
    box-shadow: 0 4px 20px rgba(170,69,245,0.07);
  }
  .adm-dash-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .adm-dash-card-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(240,235,248,0.45);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .adm-dash-card-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .adm-dash-card-value {
    font-size: 2rem;
    font-weight: 800;
    color: #F0EBF8;
    line-height: 1;
  }
  .adm-dash-card-sub {
    font-size: 0.75rem;
    color: rgba(240,235,248,0.35);
  }
  .adm-dash-section {
    background: #0D0A15;
    border: 1px solid rgba(170,69,245,0.12);
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 1.25rem;
  }
  .adm-dash-section-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(170,69,245,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .adm-dash-section-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: rgba(240,235,248,0.9);
  }
  .adm-dash-section-link {
    font-size: 0.75rem;
    color: #AA45F5;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
    font-weight: 500;
    padding: 0;
    transition: color 0.15s;
  }
  .adm-dash-section-link:hover { color: #C084FC; }
  .adm-dash-table {
    width: 100%;
    border-collapse: collapse;
  }
  .adm-dash-table th {
    padding: 0.6rem 1.25rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(240,235,248,0.35);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: left;
    border-bottom: 1px solid rgba(170,69,245,0.07);
    background: rgba(255,255,255,0.01);
  }
  .adm-dash-table td {
    padding: 0.75rem 1.25rem;
    font-size: 0.82rem;
    color: rgba(240,235,248,0.75);
    border-bottom: 1px solid rgba(170,69,245,0.05);
  }
  .adm-dash-table tr:last-child td { border-bottom: none; }
  .adm-dash-table tr:hover td { background: rgba(170,69,245,0.03); }
  .adm-dash-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    font-size: 0.68rem;
    font-weight: 600;
  }
  .adm-dash-tag-active { background: rgba(34,197,94,0.12); color: #4ADE80; }
  .adm-dash-tag-suspended { background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-dash-tag-pending { background: rgba(245,158,11,0.12); color: #FCD34D; }
  .adm-dash-tag-removed { background: rgba(239,68,68,0.12); color: #F87171; }
  .adm-dash-empty {
    text-align: center;
    padding: 2rem;
    color: rgba(240,235,248,0.3);
    font-size: 0.85rem;
  }
  .adm-dash-loading {
    text-align: center;
    padding: 2rem;
    color: rgba(240,235,248,0.3);
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
  }
  .adm-dash-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(170,69,245,0.2);
    border-top-color: #AA45F5;
    border-radius: 50%;
    animation: adm-spin 0.7s linear infinite;
  }
  @keyframes adm-spin { to { transform: rotate(360deg); } }
  .adm-dash-chart-wrap {
    padding: 1.25rem;
    overflow-x: auto;
  }
  .adm-dash-chart-svg {
    width: 100%;
    min-width: 280px;
  }
  .adm-dash-chart-bar:hover { opacity: 0.85; }
`;

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="adm-dash-card">
      <div className="adm-dash-card-header">
        <span className="adm-dash-card-label">{label}</span>
        <div className="adm-dash-card-icon" style={{ background: `${color}18` }}>
          {icon}
        </div>
      </div>
      <div className="adm-dash-card-value" style={{ color }}>
        {value ?? '—'}
      </div>
      {sub && <div className="adm-dash-card-sub">{sub}</div>}
    </div>
  );
}

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="adm-dash-empty">No analytics data available</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 600;
  const h = 160;
  const barW = Math.floor((w / data.length) * 0.55);
  const gap = Math.floor(w / data.length);
  const padBottom = 30;
  const padTop = 10;
  const chartH = h - padBottom - padTop;

  return (
    <div className="adm-dash-chart-wrap">
      <svg className="adm-dash-chart-svg" viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * chartH);
          const x = i * gap + (gap - barW) / 2;
          const y = padTop + chartH - barH;
          return (
            <g key={i}>
              <rect
                className="adm-dash-chart-bar"
                x={x} y={y} width={barW} height={barH}
                rx="4"
                fill="url(#admBarGrad)"
              />
              <text
                x={x + barW / 2} y={h - 8}
                textAnchor="middle"
                fill="#71677E"
                fontSize="10"
              >
                {d.label}
              </text>
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle"
                fill="#71677E"
                fontSize="9"
              >
                {d.value}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="admBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AA45F5" />
            <stop offset="100%" stopColor="#8B2FD8" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols}>
        <div className="adm-dash-loading">
          <div className="adm-dash-spinner" />
          Loading…
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ cols, msg = 'No data available' }) {
  return (
    <tr>
      <td colSpan={cols}>
        <div className="adm-dash-empty">{msg}</div>
      </td>
    </tr>
  );
}

function formatDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return val;
  }
}

function StatusTag({ status }) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active') return <span className="adm-dash-tag adm-dash-tag-active">Active</span>;
  if (s === 'suspended' || s === 'banned') return <span className="adm-dash-tag adm-dash-tag-suspended">{status}</span>;
  if (s === 'pending') return <span className="adm-dash-tag adm-dash-tag-pending">Pending</span>;
  if (s === 'removed' || s === 'deleted') return <span className="adm-dash-tag adm-dash-tag-removed">{status}</span>;
  return (
    <span
      className="adm-dash-tag"
      style={{ background: '#F0ECF4', color: '#62576F' }}
    >
      {status || '—'}
    </span>
  );
}

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.posts)) return payload.posts;
  if (Array.isArray(payload.reports)) return payload.reports;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function extractStats(payload) {
  if (!payload) return {};
  return payload.data ?? payload;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState(null);
  const [posts, setPosts] = useState(null);
  const [reports, setReports] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats().then((r) => { setStats(r); setLoadingStats(false); });
    adminService.getAnalytics('weekly').then(setAnalytics);
    adminService.getUsers({ limit: 5 }).then((r) => { setUsers(r); setLoadingUsers(false); }).catch(() => { setUsers(null); setLoadingUsers(false); });
    adminService.getPosts({ limit: 5 }).then((r) => { setPosts(r); setLoadingPosts(false); }).catch(() => { setPosts(null); setLoadingPosts(false); });
    adminService.getReports({ limit: 5 }).then((r) => { setReports(r); setLoadingReports(false); }).catch(() => { setReports(null); setLoadingReports(false); });
  }, []);

  const s = extractStats(stats);
  const recentUsers = extractArray(users).slice(0, 5);
  const recentPosts = extractArray(posts).slice(0, 5);
  const recentReports = extractArray(reports).slice(0, 5);

  // Build chart data from analytics
  let chartData = null;
  if (analytics) {
    const raw = analytics?.data ?? analytics;
    if (Array.isArray(raw?.daily)) {
      chartData = raw.daily.slice(-7).map((d) => ({ label: d.date?.slice(5) ?? d.day ?? '?', value: d.count ?? d.users ?? d.value ?? 0 }));
    } else if (Array.isArray(raw?.weekly)) {
      chartData = raw.weekly.slice(-7).map((d) => ({ label: d.week ?? d.label ?? '?', value: d.count ?? d.value ?? 0 }));
    } else if (typeof raw === 'object') {
      // Try generic key-value
      const entries = Object.entries(raw).filter(([, v]) => typeof v === 'number');
      if (entries.length > 0) {
        chartData = entries.slice(0, 7).map(([k, v]) => ({ label: k, value: v }));
      }
    }
  }

  return (
    <AdminProtectedRoute>
      <style>{styles}</style>
      <AdminLayout pageTitle="Dashboard">
        {/* Stat Cards */}
        <div className="adm-dash-grid">
          <StatCard
            label="Total Users"
            value={loadingStats ? '…' : (s.totalUsers ?? s.users ?? '—')}
            sub="Registered accounts"
            color="#AA45F5"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AA45F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
          />
          <StatCard
            label="Total Posts"
            value={loadingStats ? '…' : (s.totalPosts ?? s.posts ?? '—')}
            sub="Published content"
            color="#22C55E"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>}
          />
          <StatCard
            label="Active Users"
            value={loadingStats ? '…' : (s.activeUsers ?? s.active ?? '—')}
            sub="Last 30 days"
            color="#38BDF8"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
          />
          <StatCard
            label="Pending Reports"
            value={loadingStats ? '…' : (s.pendingReports ?? s.reports ?? '—')}
            sub="Require review"
            color="#F59E0B"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
          />
        </div>

        {/* Platform Growth Chart */}
        <div className="adm-dash-section" style={{ marginBottom: '1.25rem' }}>
          <div className="adm-dash-section-header">
            <span className="adm-dash-section-title">Platform Growth</span>
            <button className="adm-dash-section-link" onClick={() => { window.location.hash = '/admin/analytics'; }}>View Analytics →</button>
          </div>
          {analytics === null && chartData === null ? (
            <div className="adm-dash-empty">No analytics data available</div>
          ) : (
            <SimpleBarChart data={chartData} />
          )}
        </div>

        {/* Recent Users */}
        <div className="adm-dash-section">
          <div className="adm-dash-section-header">
            <span className="adm-dash-section-title">Recent Users</span>
            <button className="adm-dash-section-link" onClick={() => { window.location.hash = '/admin/users'; }}>View All →</button>
          </div>
          <table className="adm-dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? <LoadingRow cols={4} /> : recentUsers.length === 0 ? <EmptyRow cols={4} /> : recentUsers.map((u, i) => (
                <tr key={u._id ?? u.id ?? i}>
                  <td style={{ fontWeight: 500, color: 'rgba(240,235,248,0.9)' }}>{u.name ?? u.username ?? '—'}</td>
                  <td>{u.email ?? '—'}</td>
                  <td>{formatDate(u.createdAt ?? u.joinedAt)}</td>
                  <td><StatusTag status={u.status ?? u.accountStatus ?? 'active'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Posts */}
        <div className="adm-dash-section" style={{ marginTop: '1.25rem' }}>
          <div className="adm-dash-section-header">
            <span className="adm-dash-section-title">Recent Posts</span>
            <button className="adm-dash-section-link" onClick={() => { window.location.hash = '/admin/posts'; }}>View All →</button>
          </div>
          <table className="adm-dash-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Author</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingPosts ? <LoadingRow cols={4} /> : recentPosts.length === 0 ? <EmptyRow cols={4} /> : recentPosts.map((p, i) => (
                <tr key={p._id ?? p.id ?? i}>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.content ?? p.caption ?? p.text ?? '—'}
                  </td>
                  <td>{p.author?.name ?? p.author?.username ?? p.userId ?? '—'}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td><StatusTag status={p.status ?? 'active'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Reports */}
        <div className="adm-dash-section" style={{ marginTop: '1.25rem' }}>
          <div className="adm-dash-section-header">
            <span className="adm-dash-section-title">Recent Reports</span>
            <button className="adm-dash-section-link" onClick={() => { window.location.hash = '/admin/reports'; }}>View All →</button>
          </div>
          <table className="adm-dash-table">
            <thead>
              <tr>
                <th>Reason</th>
                <th>Reported By</th>
                <th>Target</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingReports ? <LoadingRow cols={5} /> : recentReports.length === 0 ? <EmptyRow cols={5} /> : recentReports.map((r, i) => (
                <tr key={r._id ?? r.id ?? i}>
                  <td>{r.reason ?? r.type ?? '—'}</td>
                  <td>{r.reporter?.name ?? r.reportedBy ?? '—'}</td>
                  <td>{r.targetType ?? r.contentType ?? '—'}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td><StatusTag status={r.status ?? 'pending'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}


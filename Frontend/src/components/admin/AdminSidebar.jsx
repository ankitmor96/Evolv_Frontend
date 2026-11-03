import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';

const styles = `
  .adm-sb-root {
    width: 260px;
    min-height: 100vh;
    background: #0D0A15;
    border-right: 1px solid rgba(170,69,245,0.12);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 200;
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .adm-sb-root::-webkit-scrollbar { width: 4px; }
  .adm-sb-root::-webkit-scrollbar-track { background: transparent; }
  .adm-sb-root::-webkit-scrollbar-thumb { background: rgba(170,69,245,0.2); border-radius: 4px; }
  .adm-sb-closed {
    transform: translateX(-100%);
  }
  .adm-sb-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 199;
    backdrop-filter: blur(2px);
  }
  .adm-sb-overlay-visible {
    display: block;
  }
  .adm-sb-brand {
    padding: 1.4rem 1.25rem 1rem;
    border-bottom: 1px solid rgba(170,69,245,0.1);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
  }
  .adm-sb-logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, rgba(170,69,245,0.25), rgba(139,47,216,0.15));
    border: 1px solid rgba(170,69,245,0.25);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .adm-sb-brand-text {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .adm-sb-brand-name {
    font-size: 1rem;
    font-weight: 800;
    background: linear-gradient(135deg, #C084FC, #AA45F5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }
  .adm-sb-brand-sub {
    font-size: 0.65rem;
    color: rgba(240,235,248,0.35);
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .adm-sb-nav {
    flex: 1;
    padding: 0.75rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .adm-sb-section-label {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(240,235,248,0.25);
    padding: 0.6rem 0.5rem 0.3rem;
    margin-top: 0.5rem;
  }
  .adm-sb-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    color: rgba(240,235,248,0.5);
    font-size: 0.85rem;
    font-weight: 500;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
    position: relative;
    text-decoration: none;
  }
  .adm-sb-item:hover {
    background: rgba(170,69,245,0.07);
    color: rgba(240,235,248,0.85);
  }
  .adm-sb-item-active {
    background: rgba(170,69,245,0.13) !important;
    color: #C084FC !important;
  }
  .adm-sb-item-active .adm-sb-icon {
    color: #AA45F5;
  }
  .adm-sb-item-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    background: #AA45F5;
    border-radius: 0 2px 2px 0;
  }
  .adm-sb-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: rgba(240,235,248,0.35);
    transition: color 0.15s;
  }
  .adm-sb-item:hover .adm-sb-icon {
    color: rgba(170,69,245,0.8);
  }
  .adm-sb-label {
    flex: 1;
  }
  .adm-sb-badge {
    background: #AA45F5;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.45rem;
    border-radius: 20px;
    min-width: 18px;
    text-align: center;
    line-height: 1.5;
  }
  .adm-sb-footer {
    padding: 0.75rem;
    border-top: 1px solid rgba(170,69,245,0.1);
  }
  .adm-sb-user-card {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    background: rgba(255,255,255,0.03);
    margin-bottom: 0.5rem;
  }
  .adm-sb-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #AA45F5, #8B2FD8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .adm-sb-user-info {
    flex: 1;
    min-width: 0;
  }
  .adm-sb-user-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(240,235,248,0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .adm-sb-user-role {
    font-size: 0.68rem;
    color: rgba(170,69,245,0.7);
    font-weight: 500;
  }
  .adm-sb-logout {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.75rem;
    border-radius: 10px;
    cursor: pointer;
    color: rgba(240,235,248,0.45);
    font-size: 0.82rem;
    font-weight: 500;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
  }
  .adm-sb-logout:hover {
    background: rgba(239,68,68,0.1);
    color: #FCA5A5;
  }
  .adm-sb-logout svg { flex-shrink: 0; }
  @media (min-width: 900px) {
    .adm-sb-root { transform: translateX(0) !important; }
    .adm-sb-overlay { display: none !important; }
  }
`;

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      {
        route: '/admin/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        route: '/admin/analytics',
        label: 'Analytics',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Content',
    items: [
      {
        route: '/admin/users',
        label: 'Users',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        route: '/admin/posts',
        label: 'Posts',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        route: '/admin/comments',
        label: 'Comments',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Moderation',
    items: [
      {
        route: '/admin/reports',
        label: 'Reports',
        badge: true,
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
      {
        route: '/admin/connections',
        label: 'Connections',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Communication',
    items: [
      {
        route: '/admin/notifications',
        label: 'Notifications',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        route: '/admin/settings',
        label: 'Settings',
        icon: (
          <svg className="adm-sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminSidebar({ currentRoute, onNavigate, isOpen, onClose }) {
  const [pendingReports, setPendingReports] = useState(0);
  const user = adminService.getAdminUser();

  useEffect(() => {
    adminService.getPendingReportsCount().then(setPendingReports);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  const handleNav = (route) => {
    if (!route) return;

    const nextRoute = route.startsWith('/')
      ? route
      : `/${route}`;

    // Navigate directly using the hash URL
    if (window.location.hash !== `#${nextRoute}`) {
      window.location.hash = nextRoute;
    }

    // Keep the parent layout's route state synchronized
    onNavigate?.(nextRoute);

    if (window.innerWidth < 900) {
      onClose?.();
    }
  };

  return (
    <>
      <style>{styles}</style>
      {isOpen && window.innerWidth < 900 && (
        <div className="adm-sb-overlay adm-sb-overlay-visible" onClick={onClose} />
      )}
      <aside className={`adm-sb-root${!isOpen && window.innerWidth < 900 ? ' adm-sb-closed' : ''}`}>
        {/* Brand */}
        <div className="adm-sb-brand">
          <div className="adm-sb-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AA45F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="adm-sb-brand-text">
            <span className="adm-sb-brand-name">EVOLVS</span>
            <span className="adm-sb-brand-sub">Admin Console</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="adm-sb-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section}>
              <div className="adm-sb-section-label">{section.section}</div>
              {section.items.map((item) => {
                const isActive = currentRoute === item.route;
                return (
                  <a
                    key={item.route}
                    href={`#${item.route}`}
                    className={`adm-sb-item${isActive ? ' adm-sb-item-active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth < 900) onClose?.();
                    }}
                  >
                    {item.icon}
                    <span className="adm-sb-label">{item.label}</span>
                    {item.badge && pendingReports > 0 && (
                      <span className="adm-sb-badge">{pendingReports > 99 ? '99+' : pendingReports}</span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="adm-sb-footer">
          <div className="adm-sb-user-card">
            <div className="adm-sb-avatar">{initials}</div>
            <div className="adm-sb-user-info">
              <div className="adm-sb-user-name">{user?.name || user?.email || 'Admin'}</div>
              <div className="adm-sb-user-role">Administrator</div>
            </div>
          </div>
          <button className="adm-sb-logout" onClick={() => adminService.logout()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}


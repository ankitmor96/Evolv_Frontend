import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar.jsx';
import AdminHeader from './AdminHeader.jsx';
import { navigate } from '../../utils/navigate.js';
import "../../AdminTheme.css";

const styles = `
  .adm-layout-root {
    --adm-bg: #F7F8FC;
    --adm-surface: #FFFFFF;
    --adm-surface-2: #F4F1F9;
    --adm-border: #E8E3EF;
    --adm-text: #211B2B;
    --adm-muted: #777083;
    --adm-purple: #963BE0;

    display: flex;
    min-height: 100vh;
    background: var(--adm-bg) !important;
    color: var(--adm-text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .adm-layout-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    margin-left: 260px;
    background: var(--adm-bg) !important;
    transition: margin-left 0.28s cubic-bezier(0.4,0,0.2,1);
  }

  .adm-layout-main-full {
    margin-left: 0;
  }

  .adm-layout-content {
    flex: 1;
    gap: 10px;
    padding: 1.5rem;
    overflow-x: hidden;
    background: var(--adm-bg) !important;
    color: var(--adm-text) !important;
  }

  /* Sidebar — light theme */
  .adm-layout-root .adm-sb-root {
    background: #FFFFFF !important;
    border-right: 1px solid #E8E3EF !important;
    color: #211B2B !important;
  }

  .adm-layout-root .adm-sb-brand,
  .adm-layout-root .adm-sb-footer {
    border-color: #E8E3EF !important;
  }

  .adm-layout-root .adm-sb-brand-sub,
  .adm-layout-root .adm-sb-section-label {
    color: #888092 !important;
  }

  .adm-layout-root .adm-sb-item {
    color: #625B6D !important;
  }

  .adm-layout-root .adm-sb-item:hover {
    background: #F5EFFB !important;
    color: #963BE0 !important;
  }

  .adm-layout-root .adm-sb-item-active {
    background: #F2E7FC !important;
    color: #963BE0 !important;
  }

  .adm-layout-root .adm-sb-icon {
    color: #81778E !important;
  }

  .adm-layout-root .adm-sb-item-active .adm-sb-icon {
    color: #963BE0 !important;
  }

  .adm-layout-root .adm-sb-user-card {
    background: #F7F4FA !important;
  }

  .adm-layout-root .adm-sb-user-name {
    color: #211B2B !important;
  }

  .adm-layout-root .adm-sb-user-role {
    color: #963BE0 !important;
  }

  .adm-layout-root .adm-sb-logout {
    color: #625B6D !important;
  }

  /* Main content text */
  .adm-layout-root .adm-layout-content h1,
  .adm-layout-root .adm-layout-content h2,
  .adm-layout-root .adm-layout-content h3,
  .adm-layout-root .adm-layout-content h4 {
    color: #211B2B;
  }

  /* Dashboard cards and panels */
  .adm-layout-root .adm-layout-content [class*="card"],
  .adm-layout-root .adm-layout-content [class*="panel"],
  .adm-layout-root .adm-layout-content [class*="stat"],
  .adm-layout-root .adm-layout-content [class*="section"] {
    border-color: #E8E3EF;
  }

  @media (max-width: 899px) {
    .adm-layout-main {
      margin-left: 0 !important;
    }
  }

  @media (max-width: 640px) {
    .adm-layout-content {
      padding: 1rem;
    }
  }
`;

function getRoute() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}
export default function AdminLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(getRoute);

  useEffect(() => {
    const sync = () => setCurrentRoute(getRoute());
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
    };
  }, []);

  const handleNavigate = (route) => {
    if (!route) return;
    navigate(route.startsWith('/') ? route : `/${route}`);

    setCurrentRoute(nextRoute);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="adm-layout-root" data-admin-theme="light">
        <AdminSidebar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen || window.innerWidth >= 900}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="adm-layout-main">
          <AdminHeader
            pageTitle={pageTitle}
            onMenuToggle={() => setSidebarOpen((v) => !v)}
          />
          <div className="adm-layout-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}


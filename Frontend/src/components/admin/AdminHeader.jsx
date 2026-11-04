import { useState } from 'react';
import { adminService } from '../../services/adminService.js';
import { navigate } from '../../utils/navigate.js';

const styles = `
  .adm-hdr-root {
    height: 60px;
    background: #09030F;
    border-bottom: 1px solid rgba(170,69,245,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1.25rem;
    position: sticky;
    top: 0;
    z-index: 100;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    backdrop-filter: blur(8px);
  }
  .adm-hdr-hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    cursor: pointer;
    color: rgba(240,235,248,0.6);
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  .adm-hdr-hamburger:hover {
    background: rgba(170,69,245,0.1);
    color: #C084FC;
  }
  @media (min-width: 900px) {
    .adm-hdr-hamburger { display: none; }
  }
  .adm-hdr-title {
    font-size: 1rem;
    font-weight: 700;
    color: #F0EBF8;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .adm-hdr-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .adm-hdr-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(170,69,245,0.12);
    border-radius: 8px;
    padding: 0.38rem 0.75rem;
    transition: border-color 0.2s, background 0.2s;
  }
  .adm-hdr-search:focus-within {
    border-color: rgba(170,69,245,0.35);
    background: rgba(170,69,245,0.04);
  }
  .adm-hdr-search svg { color: rgba(240,235,248,0.3); flex-shrink: 0; }
  .adm-hdr-search input {
    background: none;
    border: none;
    outline: none;
    color: #F0EBF8;
    font-size: 0.82rem;
    width: 160px;
    font-family: inherit;
  }
  .adm-hdr-search input::placeholder { color: rgba(240,235,248,0.25); }
  @media (max-width: 600px) {
    .adm-hdr-search { display: none; }
  }
  .adm-hdr-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    cursor: pointer;
    color: rgba(240,235,248,0.5);
    transition: background 0.15s, color 0.15s;
    position: relative;
  }
  .adm-hdr-icon-btn:hover {
    background: rgba(170,69,245,0.1);
    color: #C084FC;
  }
  .adm-hdr-notif-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 7px;
    height: 7px;
    background: #AA45F5;
    border-radius: 50%;
    border: 1.5px solid #09030F;
  }
  .adm-hdr-user-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(170,69,245,0.12);
    border-radius: 8px;
    padding: 0.3rem 0.7rem 0.3rem 0.4rem;
    cursor: pointer;
    color: rgba(240,235,248,0.7);
    font-size: 0.82rem;
    font-weight: 500;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
    position: relative;
  }
  .adm-hdr-user-btn:hover {
    background: rgba(170,69,245,0.08);
    border-color: rgba(170,69,245,0.25);
  }
  .adm-hdr-user-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #AA45F5, #8B2FD8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .adm-hdr-user-name {
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 480px) {
    .adm-hdr-user-name { display: none; }
  }
  .adm-hdr-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #130E20;
    border: 1px solid rgba(170,69,245,0.2);
    border-radius: 12px;
    padding: 0.4rem;
    min-width: 180px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    z-index: 300;
  }
  .adm-hdr-dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    border-radius: 8px;
    cursor: pointer;
    color: rgba(240,235,248,0.6);
    font-size: 0.82rem;
    font-weight: 500;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .adm-hdr-dropdown-item:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(240,235,248,0.9);
  }
  .adm-hdr-dropdown-item.adm-hdr-danger:hover {
    background: rgba(239,68,68,0.1);
    color: #FCA5A5;
  }
  .adm-hdr-dropdown-sep {
    height: 1px;
    background: rgba(170,69,245,0.1);
    margin: 0.3rem 0;
  }
`;

export default function AdminHeader({ pageTitle, onMenuToggle }) {
  const [dropOpen, setDropOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const user = adminService.getAdminUser();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/admin/users?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  return (
    <>
      <style>{styles}</style>
      <header className="adm-hdr-root">
        <button className="adm-hdr-hamburger" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <h1 className="adm-hdr-title">{pageTitle}</h1>

        <div className="adm-hdr-right">
          <div className="adm-hdr-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search users, posts…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <button
            className="adm-hdr-icon-btn"
            onClick={() => navigate('/admin/notifications')}  
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="adm-hdr-notif-dot" />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="adm-hdr-user-btn"
              onClick={() => setDropOpen((v) => !v)}
              aria-expanded={dropOpen}
            >
              <div className="adm-hdr-user-avatar">{initials}</div>
              <span className="adm-hdr-user-name">{user?.name || 'Admin'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {dropOpen && (
              <div className="adm-hdr-dropdown">
                <button className="adm-hdr-dropdown-item" onClick={() => { setDropOpen(false); navigate('/admin/settings'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  My Profile
                </button>
                <button className="adm-hdr-dropdown-item" onClick={() => { setDropOpen(false); navigate('/admin/settings'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Settings
                </button>
                <div className="adm-hdr-dropdown-sep" />
                <button
                  className="adm-hdr-dropdown-item adm-hdr-danger"
                  onClick={() => { setDropOpen(false); adminService.logout(); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}


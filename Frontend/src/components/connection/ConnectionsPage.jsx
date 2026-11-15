import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Search, Users, CheckCheck } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { userProfileService } from '../../services/userProfileService.js';
import { connectionService } from '../../services/connectionService.js';
import { navigate as go } from '../../utils/navigate.js';
import '../userProfile/Userprofilepage.css';

function getUserIdFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] === 'connections' ? parts[1] : null;
}

// label + style for each connection status
const CONNECT_CONFIG = {
  none: { label: '+ Connect', cls: 'primary' },
  pending: { label: 'Requested', cls: '' },
  incoming: { label: 'Accept', cls: 'primary' },
  connected: { label: 'Connected', cls: '' },
};

function PersonAvatar({ src, name }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return src && !err ? (
    <img className="cp-avatar" src={src} alt={name} onError={() => setErr(true)} />
  ) : (
    <div className="cp-avatar cp-avatar-fallback">{initials}</div>
  );
}

export default function ConnectionsPage() {
  const user = authService.getCurrentUser();
  const me = user?.id ?? user?.userId ?? user?._id ?? null;

  const [userId, setUserId] = useState(getUserIdFromPath());
  const [people, setPeople] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // { [userId]: { status, connectionId } }  — MY relationship with each person
  const [statusMap, setStatusMap] = useState({});
  const busy = useRef(new Set());

  // Re-read the id if the URL changes while this page is mounted
  useEffect(() => {
    const sync = () => setUserId(getUserIdFromPath());
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
    };
  }, []);

  // Must be logged in
  useEffect(() => {
    if (!user) go('/login');
  }, [user]);

  // Load the list of people
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    userProfileService
      .getUserConnections(userId)
      .then((res) => {
        if (cancelled) return;
        setPeople(res.people);
        setTotal(res.total);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load connections');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // Load MY connection status with everyone
  const loadStatuses = useCallback(async () => {
    if (me == null) return;
    const map = await connectionService.getConnectionMap(me).catch(() => new Map());
    const obj = {};
    map.forEach((value, key) => { obj[String(key)] = value; });
    setStatusMap(obj);
  }, [me]);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  // Connect / Accept / Cancel request / Remove
  const handleConnect = async (person) => {
    const key = String(person.id);
    if (busy.current.has(key)) return;
    busy.current.add(key);

    const entry = statusMap[key];
    const status = entry?.status ?? 'none';
    const patch = (p) =>
      setStatusMap((prev) => ({ ...prev, [key]: { ...prev[key], ...p } }));

    const findId = async () =>
      entry?.connectionId ??
      (await connectionService.getConnectionMap(me)).get(key)?.connectionId;

    try {
      if (status === 'none') {
        patch({ status: 'pending' });
        try {
          await connectionService.sendConnectionRequest(person.id);
        } catch (err) {
          if (err.status !== 409) throw err; // 409 = already exists
        }
        await loadStatuses();
      } else if (status === 'incoming') {
        const id = await findId();
        if (id == null) throw new Error('Connection record not found.');
        patch({ status: 'connected' });
        await connectionService.acceptConnectionRequest(id);
      } else {
        if (status === 'connected' &&
          !window.confirm(`Remove ${person.name} from your connections?`)) {
          return;
        }
        const id = await findId();
        if (id == null) throw new Error('Connection record not found.');
        patch({ status: 'none', connectionId: null });
        await connectionService.removeConnection(id);
      }
    } catch (err) {
      console.warn('[Connections] action failed, resyncing:', err.message);
      await loadStatuses().catch(() => { });
    } finally {
      busy.current.delete(key);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
    );
  }, [people, query]);

  const goBack = () => (window.history.length > 1 ? window.history.back() : go('/home'));
  const openPerson = (id) => {
    go(`/profile/${id}`);
    window.dispatchEvent(new Event('navigated'));
  };

  if (!user) return null;

  return (
    <div className="up-page">
      <style>{CSS}</style>

      <header className="up-header">
        <button type="button" className="up-back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="up-header-title">Connections</h1>
      </header>

      <main className="up-body">
        {loading && <p className="up-note">Loading connections...</p>}
        {!loading && error && <p className="up-note up-error">{error}</p>}

        {!loading && !error && (
          <>
            <p className="cp-total">
              <strong>{total}</strong> {total === 1 ? 'connection' : 'connections'}
            </p>

            {people.length > 0 && (
              <div className="cp-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search connections"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search connections"
                />
              </div>
            )}

            {people.length === 0 ? (
              <div className="cp-empty">
                <span className="cp-empty-icon"><Users size={28} /></span>
                <p>No connections yet.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="up-note">No one matches "{query.trim()}".</p>
            ) : (
              <ul className="cp-list">
                {filtered.map((p) => {
                  const isMe = me != null && String(p.id) === String(me);
                  const status = statusMap[String(p.id)]?.status ?? 'none';
                  const config = CONNECT_CONFIG[status];

                  return (
                    <li key={p.connectionId ?? p.id} className="cp-item">
                      <button type="button" className="cp-row" onClick={() => openPerson(p.id)}>
                        <PersonAvatar src={p.avatar} name={p.name} />
                        <span className="cp-info">
                          <span className="cp-name">{p.name}</span>
                          {p.username && <span className="cp-username">@{p.username}</span>}
                        </span>
                      </button>

                      {!isMe && (
                        <button
                          type="button"
                          className={`cp-btn ${config.cls}`}
                          onClick={() => handleConnect(p)}
                          aria-label={`${config.label} ${p.name}`}
                        >
                          {status === 'connected' && <CheckCheck size={14} aria-hidden="true" />}
                          {config.label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const CSS = `
.cp-total{margin:4px 0 14px;font-size:14px;color:#8b7aa3}
.cp-total strong{color:#1a0a2e;font-size:16px}

.cp-search{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px 14px;background:#fff;border:1px solid rgba(9,3,15,.1);border-radius:12px;color:#8b7aa3}
.cp-search:focus-within{border-color:#aa45f5}
.cp-search input{flex:1;min-width:0;border:none;outline:none;background:transparent;font:inherit;font-size:14px;color:#1a0a2e}

.cp-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.cp-item{display:flex;align-items:center;gap:10px}
.cp-row{display:flex;align-items:center;gap:14px;flex:1;min-width:0;padding:12px 14px;background:#fff;border:1px solid rgba(9,3,15,.08);border-radius:16px;text-align:left;cursor:pointer;font:inherit;transition:border-color .2s}
.cp-row:hover{border-color:rgba(170,69,245,.45)}
.cp-row:focus-visible{outline:2px solid #aa45f5;outline-offset:2px}

.cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;flex-shrink:0;min-width:96px;padding:9px 16px;border-radius:999px;border:1px solid rgba(170,69,245,.45);background:#fff;color:#aa45f5;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
.cp-btn:hover{background:rgba(170,69,245,.08)}
.cp-btn.primary{background:#aa45f5;border-color:#aa45f5;color:#fff}
.cp-btn.primary:hover{background:#9535e0}

.cp-avatar{flex-shrink:0;width:48px;height:48px;border-radius:50%;object-fit:cover}
.cp-avatar-fallback{display:flex;align-items:center;justify-content:center;background:#aa45f5;color:#fff;font-weight:700}

.cp-info{display:flex;flex-direction:column;min-width:0}
.cp-name{font-size:15px;font-weight:700;color:#1a0a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-username{font-size:12px;color:#8b7aa3}

.cp-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:64px 16px;text-align:center;color:#8b7aa3;background:#fff;border:1px dashed rgba(9,3,15,.15);border-radius:18px}
.cp-empty-icon{display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:rgba(170,69,245,.1);color:#aa45f5}
`;
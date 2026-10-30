import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Check, X, Bell, CheckCheck, FileText, UserPlus, UserCheck, MessageCircle,
} from 'lucide-react';
import { connectionService } from '../../services/connectionService.js';
import { authService } from '../../services/authService.js';
import { getStoredToken } from '../../services/sessionService.js';
import { notificationService } from '../../services/notificationService.js';
import { isMessageNotification } from '../../components/hooks/useNotificationCount.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────
const goTo = (hash) => {
  window.location.hash = hash;
  window.dispatchEvent(new Event('navigated'));
};

/** Finds the person object on a connection record. side: 'received' | 'sent' */
const getPerson = (rec, side) => {
  const candidates =
    side === 'received'
      ? [rec.requester, rec.sender, rec.fromUser, rec.user, rec.requesterUser]
      : [rec.receiver, rec.addressee, rec.toUser, rec.user, rec.receiverUser];

  const person = candidates.find((c) => c && typeof c === 'object') ?? {};
  const profile = person.profile ?? {};

  const id =
    person.id ??
    (side === 'received'
      ? rec.requesterId ?? rec.senderId ?? rec.fromUserId
      : rec.receiverId ?? rec.addresseeId ?? rec.toUserId) ??
    null;

  return {
    id,
    name:
      person.fullName ?? person.name ?? profile.fullName ?? profile.name ??
      person.username ?? profile.username ?? (id != null ? `User #${id}` : 'Someone'),
    username: person.username ?? profile.username ?? '',
    avatar: person.avatarUrl ?? person.avatar ?? profile.avatarUrl ?? profile.avatar ?? '',
  };
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

/** Hides technical IDs, e.g. "(ID: 98)" or "#75", from the text users see */
const cleanText = (text) =>
  String(text ?? '')
    .replace(/\s*\(\s*ID:?\s*\d+\s*\)/gi, '')
    .replace(/\s*#\d+/g, '')
    .replace(/\s+([.,!?])/g, '$1')
    .trim();

const isPending = (rec) => String(rec?.status ?? 'PENDING').toUpperCase() === 'PENDING';

/** Which group a notification belongs to: today | week | earlier */
const bucketOf = (iso) => {
  if (!iso) return 'earlier';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'today';
  return now - d < 7 * 86400000 ? 'week' : 'earlier';
};
const GROUPS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'earlier', label: 'Earlier' },
];

const TYPE_ICON = {
  POST_CREATED: { icon: FileText, tone: 'purple' },
  CONNECTION_REQUEST: { icon: UserPlus, tone: 'blue' },
  CONNECTION_ACCEPTED: { icon: UserCheck, tone: 'green' },
};

function PersonAvatar({ src, name }) {
  const [err, setErr] = useState(false);
  const initials = (name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return src && !err ? (
    <img className="np-avatar" src={src} alt={name} onError={() => setErr(true)} />
  ) : (
    <div className="np-avatar np-avatar-fallback">{initials}</div>
  );
}

function Empty({ text }) {
  return (
    <div className="np-empty">
      <span className="np-empty-icon"><Bell size={28} /></span>
      <p>{text}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const user = authService.getCurrentUser();

  const [tab, setTab] = useState('all');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [people, setPeople] = useState({});
  const [all, setAll] = useState([]);

  useEffect(() => {
    if (!user) goTo('/login');
  }, [user]);

  const load = useCallback(async (silent = false) => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);

    const [r, s, n] = await Promise.all([
      connectionService.getReceivedRequests(),
      connectionService.getSentRequests(),
      notificationService.getAll().catch(() => []),
    ]);

    setReceived(r.filter(isPending));
    setSent(s.filter(isPending));
    setAll(n);
    if (!silent) setLoading(false);
  }, []);

  // Fetch name/avatar for every user ID we don't know yet
  useEffect(() => {
    const ids = [
      ...received.map((r) => getPerson(r, 'received').id),
      ...sent.map((r) => getPerson(r, 'sent').id),
    ]
      .filter((id) => id != null)
      .map(String);

    const missing = [...new Set(ids)].filter((id) => !(id in people));
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map(async (id) => [id, await connectionService.getUserSummary(id)])
    ).then((entries) => {
      if (cancelled) return;
      setPeople((prev) => {
        const next = { ...prev };
        entries.forEach(([id, u]) => { next[id] = u; });
        return next;
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [received, sent]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const unreadCount = all.filter((n) => !n.isRead).length;

  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: all.filter((n) => bucketOf(n.createdAt) === g.key) }))
      .filter((g) => g.items.length > 0),
    [all]
  );

  const openNotification = async (n) => {
    if (n.type === 'CONNECTION_REQUEST') setTab('received');

    if (!n.isRead) {
      setAll((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      try {
        await notificationService.markRead(n.id);
        window.dispatchEvent(new Event('notifications-changed'));
      } catch {
        setAll((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)));
      }
    }

    if (isMessageNotification(n)) goTo('/messages');
  };

  const markAllRead = async () => {
    const prev = all;
    setAll((l) => l.map((x) => ({ ...x, isRead: true })));
    try {
      await notificationService.markAllRead();
      window.dispatchEvent(new Event('notifications-changed'));
    } catch {
      setAll(prev);
      showToast('Could not mark all as read');
    }
  };

  const act = async (rec, action) => {
    const id = rec.id ?? rec.connectionId;
    if (id == null || busyId != null) return;
    setBusyId(id);
    try {
      if (action === 'accept') {
        await connectionService.acceptConnectionRequest(id);
        showToast('Connection accepted 🎉');
      } else if (action === 'reject') {
        await connectionService.rejectConnectionRequest(id);
        showToast('Request rejected');
      } else {
        await connectionService.removeConnection(id);
        showToast('Request cancelled');
      }
      setReceived((l) => l.filter((x) => (x.id ?? x.connectionId) !== id));
      setSent((l) => l.filter((x) => (x.id ?? x.connectionId) !== id));
      window.dispatchEvent(new Event('connections-changed'));
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (err) {
      showToast(err.message || 'Something went wrong');
      load(true);
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return null;

  const TABS = [
    { id: 'all', label: 'All', count: unreadCount, hot: true },
    { id: 'received', label: 'Requests', count: received.length, hot: true },
    { id: 'sent', label: 'Sent', count: sent.length, hot: false },
  ];

  const list = tab === 'received' ? received : sent;

  // ── Renderers ──
  const renderNotification = (n) => {
    const { icon: Icon, tone } = TYPE_ICON[n.type] ?? (
      isMessageNotification(n) ? { icon: MessageCircle, tone: 'blue' } : { icon: Bell, tone: 'purple' }
    );
    return (
      <li key={n.id}>
        <div
          className={`np-item np-notif${n.isRead ? '' : ' unread'}`}
          onClick={() => openNotification(n)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openNotification(n)}
        >
          <span className={`np-icon ${tone}`}><Icon size={20} aria-hidden="true" /></span>
          <div className="np-info">
            <p className="np-text"><strong>{cleanText(n.title)}</strong></p>
            <p className="np-text np-sub">{cleanText(n.message)}</p>
            <span className="np-time">{timeAgo(n.createdAt)}</span>
          </div>
          {!n.isRead && <span className="np-dot" aria-label="Unread" />}
        </div>
      </li>
    );
  };

  const renderRequest = (rec) => {
    const id = rec.id ?? rec.connectionId;
    const base = getPerson(rec, tab);
    const extra = people[String(base.id)];
    const person = {
      ...base,
      name: extra?.name ?? base.name,
      username: extra?.username || base.username,
      avatar: extra?.avatar || base.avatar,
    };
    const busy = busyId === id;

    return (
      <li key={id}>
        <div className="np-item">
          <button
            type="button"
            className="np-avatar-btn"
            onClick={() => person.id != null && goTo(`/profile/${person.id}`)}
            aria-label={`View ${person.name}'s profile`}
          >
            <PersonAvatar src={person.avatar} name={person.name} />
          </button>

          <div className="np-info">
            <p className="np-text">
              <strong>{person.name}</strong>{' '}
              {tab === 'received' ? 'wants to connect with you' : 'has not responded yet'}
            </p>
            <span className="np-time">
              {person.username && `@${person.username} · `}{timeAgo(rec.createdAt)}
            </span>
          </div>

          {tab === 'received' ? (
            <div className="np-actions">
              <button className="np-btn accept" disabled={busy} onClick={() => act(rec, 'accept')}>
                <Check size={14} /> Accept
              </button>
              <button className="np-btn reject" disabled={busy} onClick={() => act(rec, 'reject')} aria-label="Reject request">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="np-actions">
              <button className="np-btn reject wide" disabled={busy} onClick={() => act(rec, 'cancel')}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="np-page">
      <style>{CSS}</style>

      <div className="np-shell">
        {/* Desktop: left panel · Mobile: sticky top bar */}
        <aside className="np-side">
          <div className="np-top">
            <button className="np-back" onClick={() => goTo('/home')} aria-label="Back to home">
              <ArrowLeft size={20} />
            </button>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <button className="np-markall" onClick={markAllRead} aria-label="Mark all as read">
                <CheckCheck size={18} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="np-tabs" role="tablist" aria-label="Notification filters">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`np-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.label}</span>
                {t.count > 0 && <span className={`np-count${t.hot ? '' : ' muted'}`}>{t.count}</span>}
              </button>
            ))}
          </div>
        </aside>

        <main className="np-main">
          {loading ? (
            <p className="np-loading" role="status">Loading…</p>
          ) : tab === 'all' ? (
            grouped.length === 0 ? (
              <Empty text="No notifications yet." />
            ) : (
              grouped.map((g) => (
                <section key={g.key} className="np-group">
                  <h2 className="np-group-title">{g.label}</h2>
                  <ul className="np-list">{g.items.map(renderNotification)}</ul>
                </section>
              ))
            )
          ) : list.length === 0 ? (
            <Empty text={tab === 'received' ? 'No pending connection requests.' : 'You have no pending sent requests.'} />
          ) : (
            <ul className="np-list">{list.map(renderRequest)}</ul>
          )}
        </main>
      </div>

      {toast && <div className="np-toast" role="status">{toast}</div>}
    </div>
  );
}

const CSS = `
.np-page{--accent:#aa45f5;--accent-soft:rgba(170,69,245,.1);--text:#1a0a2e;--muted:#8b7aa3;--line:rgba(9,3,15,.08);
  min-height:100dvh;background:#f4f3fa;color:var(--text);font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.45}
.np-page *{box-sizing:border-box}
.np-page h1,.np-page h2,.np-page p,.np-page ul{margin:0;padding:0}
.np-page ul{list-style:none}
.np-page button{font:inherit;cursor:pointer}
.np-page button:focus-visible,.np-notif:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ── Desktop (≥1025px): left panel + right list ── */
.np-shell{display:grid;grid-template-columns:300px minmax(0,720px);gap:28px;justify-content:center;max-width:1120px;margin:0 auto;padding:32px 24px 48px;align-items:start}
.np-side{position:sticky;top:32px;display:flex;flex-direction:column;gap:20px;padding:22px;background:#fff;border:1px solid var(--line);border-radius:18px}
.np-top{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.np-top h1{flex:1;font-size:22px;font-weight:700;letter-spacing:-.01em}
.np-back{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(9,3,15,.12);border-radius:12px;background:#fff;color:var(--text)}
.np-back:hover{border-color:var(--accent);color:var(--accent)}
.np-markall{display:inline-flex;align-items:center;gap:8px;width:100%;order:3;padding:9px 12px;border:none;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-size:13px;font-weight:600}
.np-markall:hover{background:rgba(170,69,245,.18)}

.np-tabs{display:flex;flex-direction:column;gap:4px}
.np-tab{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:11px 14px;border:none;border-radius:10px;background:none;color:#2d1b4e;font-size:14px;font-weight:600;text-align:left;transition:background .2s,color .2s}
.np-tab:hover{background:var(--accent-soft)}
.np-tab.active{background:var(--accent);color:#fff}
.np-count{min-width:22px;padding:1px 8px;border-radius:999px;background:#ef476f;color:#fff;font-size:11px;font-weight:700;text-align:center}
.np-count.muted{background:rgba(9,3,15,.12);color:var(--text)}
.np-tab.active .np-count{background:#fff;color:var(--accent)}

.np-main{min-width:0}
.np-group{margin-bottom:24px}
.np-group-title{margin-bottom:10px;padding-left:4px;font-size:13px;font-weight:700;color:var(--muted)}
.np-list{display:flex;flex-direction:column;gap:10px}

.np-item{display:flex;align-items:center;gap:14px;padding:14px 16px;background:#fff;border:1px solid var(--line);border-radius:16px}
.np-notif{cursor:pointer;transition:border-color .2s,transform .15s}
.np-notif:hover{border-color:rgba(170,69,245,.4)}
.np-notif.unread{background:#f8f1ff;border-color:rgba(170,69,245,.3)}

.np-icon{flex-shrink:0;display:grid;place-items:center;width:44px;height:44px;border-radius:50%}
.np-icon.purple{background:rgba(170,69,245,.13);color:var(--accent)}
.np-icon.blue{background:rgba(59,130,246,.13);color:#2f6fe0}
.np-icon.green{background:rgba(34,197,94,.14);color:#16a05d}

.np-avatar-btn{flex-shrink:0;padding:0;border:none;background:none;border-radius:50%;display:flex}
.np-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover}
.np-avatar-fallback{display:flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-weight:700}

.np-info{flex:1;min-width:0}
.np-text{font-size:14px;overflow-wrap:anywhere}
.np-text strong{font-weight:700}
.np-sub{color:#4a3d63}
.np-time{display:block;margin-top:3px;font-size:12px;color:var(--muted)}
.np-dot{flex-shrink:0;width:10px;height:10px;border-radius:50%;background:#ef476f}

.np-actions{display:flex;gap:8px;flex-shrink:0}
.np-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:8px 16px;border:1.5px solid transparent;border-radius:999px;font-size:13px;font-weight:600}
.np-btn:disabled{opacity:.5;cursor:not-allowed}
.np-btn.accept{background:var(--accent);color:#fff}
.np-btn.accept:hover:not(:disabled){background:#8a2be2}
.np-btn.reject{padding:8px 11px;background:#fff;border-color:rgba(9,3,15,.2);color:#444}
.np-btn.reject.wide{padding:8px 16px}
.np-btn.reject:hover:not(:disabled){border-color:#ef476f;color:#ef476f}

.np-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:80px 16px;text-align:center;color:var(--muted);background:#fff;border:1px dashed rgba(9,3,15,.15);border-radius:18px}
.np-empty-icon{display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:var(--accent-soft);color:var(--accent)}
.np-loading{padding:60px 0;text-align:center;color:var(--muted)}

.np-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:50;max-width:90vw;padding:10px 18px;border-radius:999px;background:#1a0a2e;color:#fff;font-size:13px}

/* ── Laptop small (≤1180px) ── */
@media (max-width:1180px){
  .np-shell{grid-template-columns:250px minmax(0,1fr);gap:20px;padding:24px 20px 40px}
  .np-side{padding:18px}
  .np-top h1{font-size:20px}
}

/* ── Tablet & Mobile (≤1024px): sticky top bar + pill tabs, single column ── */
@media (max-width:1024px){
  .np-shell{display:block;max-width:760px;padding:0 0 40px}
  .np-side{position:sticky;top:0;z-index:10;gap:12px;padding:12px 16px 12px;background:#fff;border:none;border-bottom:1px solid var(--line);border-radius:0}
  .np-top{flex-wrap:nowrap;gap:10px}
  .np-top h1{font-size:18px}
  .np-markall{width:auto;order:0;padding:8px;border-radius:50%}
  .np-markall span{display:none}
  .np-tabs{flex-direction:row;gap:8px;overflow-x:auto;scrollbar-width:none}
  .np-tabs::-webkit-scrollbar{display:none}
  .np-tab{width:auto;flex-shrink:0;padding:8px 16px;border:1px solid rgba(9,3,15,.12);border-radius:999px;background:#fff}
  .np-tab.active{border-color:var(--accent)}
  .np-main{padding:16px 16px 0}
}

/* ── Phones (≤480px) ── */
@media (max-width:480px){
  .np-side{padding:10px 12px}
  .np-main{padding:12px 12px 0}
  .np-item{flex-wrap:wrap;gap:12px;padding:12px}
  .np-icon{width:40px;height:40px}
  .np-avatar{width:42px;height:42px}
  .np-text{font-size:13px}
  .np-actions{width:100%;justify-content:flex-end}
  .np-btn{flex:1;padding:10px 14px}
  .np-btn.reject:not(.wide){flex:0 0 auto}
  .np-notif .np-info{flex:1 1 0}
  .np-group{margin-bottom:18px}
  .np-empty{padding:56px 16px}
}
@media (max-width:360px){
  .np-top h1{font-size:16px}
  .np-tab{padding:7px 12px;font-size:13px}
}
@media (prefers-reduced-motion:reduce){.np-page *{transition:none!important}}
`;

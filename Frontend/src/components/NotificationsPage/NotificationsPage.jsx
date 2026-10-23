import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, X, UserPlus, Bell } from 'lucide-react';
import { connectionService } from '../../services/connectionService.js';
import { authService } from '../../services/authService.js';

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

const isPending = (rec) => {
  const s = String(rec?.status ?? 'PENDING').toUpperCase();
  return s === 'PENDING';
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

// ── Page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const user = authService.getCurrentUser();

  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [people, setPeople] = useState({});

  // Guard: must be logged in
  useEffect(() => {
    if (!user) goTo('/login');
  }, [user]);


  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [r, s] = await Promise.all([
      connectionService.getReceivedRequests(),
      connectionService.getSentRequests(),
    ]);
    setReceived(r.filter(isPending));
    setSent(s.filter(isPending));
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
        entries.forEach(([id, user]) => { next[id] = user; });
        return next;
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [received, sent]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000); // refresh every 30s
    return () => clearInterval(t);
  }, [load]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
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
        await connectionService.removeConnection(id); // cancel my sent request
        showToast('Request cancelled');
      }
      // Remove from the list immediately
      setReceived((l) => l.filter((x) => (x.id ?? x.connectionId) !== id));
      setSent((l) => l.filter((x) => (x.id ?? x.connectionId) !== id));
    } catch (err) {
      showToast(err.message || 'Something went wrong');
      load(true);
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return null;

  const list = tab === 'received' ? received : sent;

  return (
    <div className="np-page">
      <style>{CSS}</style>

      <header className="np-header">
        <button className="np-back" onClick={() => goTo('/home')} aria-label="Back to home">
          <ArrowLeft size={20} />
        </button>
        <h1>Notifications</h1>
      </header>

      <div className="np-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'received'}
          className={`np-tab ${tab === 'received' ? 'active' : ''}`}
          onClick={() => setTab('received')}
        >
          Requests {received.length > 0 && <span className="np-count">{received.length}</span>}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'sent'}
          className={`np-tab ${tab === 'sent' ? 'active' : ''}`}
          onClick={() => setTab('sent')}
        >
          Sent {sent.length > 0 && <span className="np-count muted">{sent.length}</span>}
        </button>
      </div>

      <main className="np-list">
        {loading ? (
          <p className="np-empty">Loading…</p>
        ) : list.length === 0 ? (
          <div className="np-empty">
            <Bell size={32} />
            <p>{tab === 'received' ? 'No pending connection requests.' : 'You have no pending sent requests.'}</p>
          </div>
        ) : (
          list.map((rec) => {
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
              <div className="np-item" key={id}>
                <PersonAvatar src={person.avatar} name={person.name} />

                <div className="np-info">
                  <p className="np-text">
                    <strong>{person.name}</strong>{' '}
                    {tab === 'received'
                      ? 'wants to connect with you'
                      : 'has not responded yet'}
                  </p>
                  <span className="np-time">
                    {person.username && `@${person.username} · `}
                    {timeAgo(rec.createdAt)}
                  </span>
                </div>

                {tab === 'received' ? (
                  <div className="np-actions">
                    <button
                      className="np-btn accept"
                      disabled={busy}
                      onClick={() => act(rec, 'accept')}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      className="np-btn reject"
                      disabled={busy}
                      onClick={() => act(rec, 'reject')}
                      aria-label="Reject request"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="np-btn reject wide"
                    disabled={busy}
                    onClick={() => act(rec, 'cancel')}
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>

      {toast && <div className="np-toast" role="status">{toast}</div>}
    </div>
  );
}

const CSS = `
.np-page{min-height:100dvh;background:#f4f3fa;font-family:'Inter',sans-serif;color:#09030f;padding-bottom:40px}
.np-header{display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-bottom:1px solid rgba(9,3,15,.08);position:sticky;top:0;z-index:5}
.np-header h1{font-size:18px;font-weight:700;margin:0}
.np-back{width:38px;height:38px;border-radius:12px;border:1px solid rgba(9,3,15,.12);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.np-back:hover{border-color:#aa45f5;color:#aa45f5}
.np-tabs{display:flex;gap:8px;max-width:680px;margin:16px auto 0;padding:0 16px}
.np-tab{padding:8px 18px;border:1px solid rgba(9,3,15,.12);border-radius:999px;background:#fff;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.np-tab.active{background:#aa45f5;border-color:#aa45f5;color:#fff}
.np-count{background:#ef476f;color:#fff;border-radius:999px;font-size:11px;padding:1px 7px}
.np-count.muted{background:rgba(9,3,15,.15);color:#09030f}
.np-tab.active .np-count.muted{background:rgba(255,255,255,.3);color:#fff}
.np-list{max-width:680px;margin:14px auto 0;padding:0 16px;display:flex;flex-direction:column;gap:10px}
.np-item{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid rgba(9,3,15,.08);border-radius:14px;padding:12px 14px}
.np-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0}
.np-avatar-fallback{background:#aa45f5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.np-info{flex:1;min-width:0}
.np-text{margin:0 0 2px;font-size:14px;line-height:1.35}
.np-time{font-size:12px;color:#8b7aa3}
.np-actions{display:flex;gap:6px;flex-shrink:0}
.np-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid transparent}
.np-btn:disabled{opacity:.5;cursor:not-allowed}
.np-btn.accept{background:#aa45f5;color:#fff}
.np-btn.accept:hover:not(:disabled){background:#8a2be2}
.np-btn.reject{background:#fff;border-color:rgba(9,3,15,.2);color:#444;padding:7px 10px}
.np-btn.reject.wide{padding:7px 14px}
.np-btn.reject:hover:not(:disabled){border-color:#ef476f;color:#ef476f}
.np-empty{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;color:#8b7aa3;padding:60px 0;font-size:14px}
.np-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a0a2e;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;z-index:50}
@media(max-width:480px){.np-item{flex-wrap:wrap}.np-actions{width:100%;justify-content:flex-end}}
`;
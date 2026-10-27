
import { forceLogout } from './sessionService.js';
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';
const BASE = `${API_BASE_URL}/api/messaging`; 
const TOKEN_KEYS = ['evolv_auth_token', 'token', 'accessToken', 'access_token'];

// Check DevTools → Application → Local Storage and keep the key your login uses
const getToken = () => {
  for (const key of TOKEN_KEYS) {
    const t = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (t) return t.replace(/^"|"$/g, '');
  }
  return null;
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

async function request(path, options = {}) {
  const token = getToken();
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && token) forceLogout();

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(' ')
      : payload?.message || payload?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

// Backend sends { success, count, data: [...] }
const toList = (res, key) => {
  if (Array.isArray(res)) return res;
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (key && Array.isArray(d?.[key])) return d[key];
  return [];
};

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

// ── Backend shape → UI shape. Change field names ONLY here. ──
const normaliseConversation = (c = {}) => {
  const other = c.otherUser ?? c.participant ?? c.user ?? c.partner ?? {};
  const last = c.lastMessage;
  const lastText =
    typeof last === 'string' ? last : last?.text ?? last?.content ?? last?.message ?? '';
  const lastTime = typeof last === 'object' ? last?.createdAt : null;

  return {
    id: c.id ?? c.conversationId ?? c.conversation?.id,
    user:
      other.name ?? other.username ?? c.otherUserName ?? c.name ??
      (typeof c.user === 'string' ? c.user : 'Unknown'),
    avatar: other.avatarUrl ?? c.otherUserAvatar ?? c.avatarUrl ?? c.avatar ?? '',
    online: Boolean(other.online ?? c.online),
    lastMessage: lastText,
    timestamp: formatTime(lastTime ?? c.updatedAt ?? c.lastMessageAt) || c.timestamp || '',
    unreadCount: Number(c.unreadCount ?? 0),
  };
};

const normaliseMessage = (m = {}, myId) => {
  const senderId = m.senderId ?? m.sender_id ?? m.sender?.id;
  return {
    id: m.id ?? m.messageId,
    sender: String(senderId) === String(myId) ? 'me' : 'them',
    text: m.text ?? m.content ?? m.message ?? '',
    timestamp: formatTime(m.createdAt ?? m.created_at) || m.timestamp || '',
    status: m.status ?? (m.readAt || m.isRead ? 'read' : 'delivered'),
    type: m.type ?? 'text',
    card: m.card,
  };
};

export const messageService = {
  // GET /messaging/conversations
  async getConversations() {
    const res = await request('/conversations');
    return toList(res, 'conversations').map(normaliseConversation);
  },

  // GET /messaging/conversations/:id/messages
  async getMessages(conversationId, myId) {
    const res = await request(`/conversations/${conversationId}/messages`);
    return toList(res, 'messages').map((m) => normaliseMessage(m, myId));
  },

  // POST /messaging/conversations/:id/messages   body: { text }
  async sendMessage(conversationId, text, myId) {
    const res = await request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      // some backends expect "content" instead of "text", so we send both
      body: JSON.stringify({ text, content: text }),
    });
    return normaliseMessage(res?.data?.message ?? res?.data ?? res, myId);
  },

  // PATCH /messaging/conversations/:id/read
  async markRead(conversationId) {
    return request(`/conversations/${conversationId}/read`, { method: 'PATCH' });
  },

  // GET /messaging/connections/search?search=kalpesh
  // → [{ userId, name, username, avatarUrl }]
  async searchConnections(query) {
    const res = await request(`/connections/search?search=${encodeURIComponent(query)}`);
    return toList(res);
  },

  // POST /messaging/conversations/start/:userId
  async startConversation(userId, person) {
    const res = await request(`/conversations/start/${userId}`, { method: 'POST' });
    const raw = res?.data?.conversation ?? res?.data ?? res;
    const conv = normaliseConversation(raw);
    return {
      ...conv,
      user: conv.user === 'Unknown' ? person?.name ?? person?.username ?? 'Unknown' : conv.user,
      avatar: conv.avatar || person?.avatarUrl || '',
    };
  },
};
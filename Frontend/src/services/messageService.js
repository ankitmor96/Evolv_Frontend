// src/services/messageService.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(), ...options });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// Convert backend shape → the shape the UI already uses.
// If your backend field names differ, change them ONLY here.
const normaliseConversation = (c) => ({
  id: c.id,
  user: c.otherUser?.name ?? c.user ?? 'Unknown',
  avatar: c.otherUser?.avatarUrl ?? c.avatar ?? '',
  online: Boolean(c.otherUser?.online ?? c.online),
  lastMessage: c.lastMessage?.text ?? c.lastMessage ?? '',
  timestamp: c.lastMessage?.createdAt ?? c.timestamp ?? '',
  unreadCount: c.unreadCount ?? 0,
});

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

const normaliseMessage = (m, myId) => ({
  id: m.id,
  sender: String(m.senderId) === String(myId) ? 'me' : 'them',
  text: m.text ?? '',
  timestamp: formatTime(m.createdAt) || m.timestamp || '',
  status: m.status ?? (m.readAt ? 'read' : 'delivered'),
  type: m.type ?? 'text',
  card: m.card, // only for learning-card messages
});

export const messageService = {
  async getConversations() {
    const res = await request('/conversations');
    const list = Array.isArray(res) ? res : res?.data ?? [];
    return list.map(normaliseConversation);
  },

  async getMessages(conversationId, myId) {
    const res = await request(`/conversations/${conversationId}/messages`);
    const list = Array.isArray(res) ? res : res?.data ?? [];
    return list.map((m) => normaliseMessage(m, myId));
  },

  async sendMessage(conversationId, text, myId) {
    const res = await request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return normaliseMessage(res?.data ?? res, myId);
  },

  async markRead(conversationId) {
    return request(`/conversations/${conversationId}/read`, { method: 'PATCH' });
  },
};
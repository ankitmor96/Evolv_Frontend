import { forceLogout, getStoredToken } from './sessionService.js';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';
const BASE = `${API_BASE_URL}/api/notifications`;

async function request(path = '', options = {}) {
  const token = getStoredToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && token) forceLogout();

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(payload?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return payload;
}

export const notificationService = {
  // GET /api/notifications  →  { success, notifications: [...] }
  async getAll() {
    const res = await request('');
    const list = res?.notifications ?? res?.data?.notifications ?? res?.data ?? [];
    return Array.isArray(list) ? list : [];
  },

  // PATCH /api/notifications/:id/read   (check the exact path in your Postman collection)
  async markRead(id) {
    return request(`/${id}/read`, { method: 'PATCH' });
  },

  // PATCH /api/notifications/read-all   (check the exact path in your Postman collection)
    // Mark all notifications as read.
  async markAllRead(unreadIds = []) {
    try {
      return await request('/read-all', { method: 'PATCH' });
    } catch (err) {
      if (err.status !== 404 && err.status !== 405) throw err;

      if (unreadIds.length === 0) return { success: true };

      const results = await Promise.allSettled(
        unreadIds.map((id) => this.markRead(id))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === unreadIds.length) throw new Error('Could not mark notifications as read');
      return { success: true, failed };
    }
  },
};
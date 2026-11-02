/**
 * EVOLV Learned Service
 *
 * Verified endpoint (Postman):
 *   GET /api/posts/my-posts/learned-count
 *   → { success: true, data: { learnedCount: number } }
 */
import { forceLogout } from './sessionService.js';

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ??
  'https://evolve-backend-4lux.onrender.com';

const TOKEN_KEY = 'evolv_auth_token';

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY) ||
  null;

const request = async (path, opts = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const token = getToken();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
  };

  const response = await fetch(url, { ...opts, headers });
  if (response.status === 401 && token) forceLogout();

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const { message } = payload ?? {};
    const msg = Array.isArray(message)
      ? message.join(' ')
      : typeof message === 'string' && message.trim()
        ? message
        : payload?.error ?? `Request failed with status ${response.status}.`;
    const err = new Error(msg);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
};

export const learnedService = {
  /**
   * Total number of "Learned" reactions on the logged-in user's posts.
   * GET /api/posts/my-posts/learned-count
   * @returns {Promise<number>}
   */
  async getMyLearnedCount() {
    const res = await request('/api/posts/my-posts/learned-count', { method: 'GET' });
    return Number(res?.data?.learnedCount ?? res?.learnedCount ?? 0);
  },
};

export default learnedService;
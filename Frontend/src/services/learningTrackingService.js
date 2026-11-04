/**
 * EVOLV Learning Tracking Service
 *   POST /api/v1/learning/track/start
 *   POST /api/v1/learning/track/progress
 *   POST /api/v1/learning/track/end
 *   GET  /api/v1/learning/overview?period=month|all
 */
import { forceLogout } from './sessionService.js';

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ??
  'https://evolve-backend-4lux.onrender.com';

const TOKEN_KEY = 'evolv_auth_token';
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;

const request = async (path, opts = {}) => {
  const token = getToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
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

/** Backend enum (from the PDF): VIDEO, TEXT, IMAGE, LONG_FORM */
const CONTENT_TYPE_MAP = {
  image: 'IMAGE',
  text: 'TEXT',
  video: 'VIDEO',
  document: 'LONG_FORM',
  article: 'LONG_FORM',
};
export const toApiContentType = (t = '') =>
  CONTENT_TYPE_MAP[String(t).toLowerCase()] ?? String(t).toUpperCase();

export const newProgressId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const learningTrackingService = {
  start({ postId, contentType }) {
    return request('/api/v1/learning/track/start', {
      method: 'POST',
      body: JSON.stringify({
        postId: Number(postId),
        contentType: toApiContentType(contentType),
      }),
    });
  },

  /** activeSeconds = seconds in THIS batch. Reuse progressId when retrying. */
  progress({ sessionId, progressId, activeSeconds, completionPercentage = 0, isActive = true, keepalive = false }) {
    return request('/api/v1/learning/track/progress', {
      method: 'POST',
      keepalive,
      body: JSON.stringify({
        sessionId,
        progressId,
        activeSeconds,
        completionPercentage: Math.max(0, Math.min(100, Math.round(completionPercentage))),
        isActive,
      }),
    });
  },

  async end({ sessionId, keepalive = false }) {
    const res = await request('/api/v1/learning/track/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
      keepalive,
    });
    window.dispatchEvent(new Event('learning-updated'));
    return res;
  },

  /** @param {'month'|'all'} period */
  async getOverview(period = 'month') {
    const res = await request(`/api/v1/learning/overview?period=${period}`, { method: 'GET' });
    const pe = res?.posts_explored ?? {};
    return {
      value: Number(pe.value ?? 0),
      previous: pe.previous_period_value ?? null,
      change: pe.change_percentage ?? null,
      allTime: Number(res?.all_time_posts_explored ?? pe.value ?? 0),
      period: res?.period ?? null,
    };
  },
  /** @param {'month'|'all'} period */
  async getContentBreakdown(period = 'month') {
    const res = await request(`/api/v1/learning/content-breakdown?period=${period}`, { method: 'GET' });
    const rows = Array.isArray(res?.content_breakdown) ? res.content_breakdown : [];
    const byType = {};
    rows.forEach((r) => {
      byType[String(r.type).toUpperCase()] = {
        count: Number(r.count) || 0,
        percentage: Number(r.percentage) || 0,
      };
    });
    return { total: Number(res?.total_posts_explored ?? 0), byType };
  },
  /** Consecutive days learned streak */
  async getStreak() {
    const res = await request('/api/v1/learning/streak', { method: 'GET' });
    return {
      currentStreak: Number(res?.currentStreak ?? 0),
      lastLearnedDate: res?.lastLearnedDate ?? null,
    };
  },
};

export default learningTrackingService;

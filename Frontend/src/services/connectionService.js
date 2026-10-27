/**
 * EVOLV Connection Service
 *
 * Handles all Connection API communication.
 * Follows the same conventions as authService.js and profileService.js:
 *   - Token from localStorage / sessionStorage (key: "evolv_auth_token")
 *   - Authorization: Bearer <token> on every request
 *   - Throws an Error with { message, status, payload } on non-2xx
 *
 * Verified endpoints (confirmed via Postman screenshots):
 *
 *   POST   /api/connections/request/:userId    — send a connection request
 *   POST   /api/connections/:id/accept         — accept a received request
 *   POST   /api/connections/:id/reject         — reject a received request
 *   GET    /api/connections/requests/received  — list received requests
 *   GET    /api/connections/requests/sent      — list sent requests
 *   GET    /api/connections                    — list accepted connections
 *   DELETE /api/connections/:id                — cancel request or remove connection
 *
 * Backend base URL: VITE_API_BASE_URL
 * (e.g. https://evolve-backend-4lux.onrender.com)
 *
 * NOTE: The backend does NOT currently emit Socket.IO events for connection
 * actions (the existing PostsGateway handles posts and comments only).
 * All connection state updates therefore happen via REST responses.
 */

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ??
  'https://evolve-backend-4lux.onrender.com';

const TOKEN_KEY = 'evolv_auth_token';
import { forceLogout } from './sessionService.js';

// ─── Token helper ─────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY) ||
  null;

// ─── Reusable fetch wrapper ───────────────────────────────────────────────────
/**
 * @param {string} path       – e.g. "/api/connections"
 * @param {RequestInit} opts  – fetch init overrides (method, body, headers…)
 * @returns {Promise<any>}    – parsed JSON response body
 * @throws {Error}            – with .status and .payload attached on non-2xx
 */
const request = async (path, opts = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const token = getToken();

  const isFormData = opts.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers ?? {}),
  };

  const init = {
    ...opts,
    headers,
    body:
      opts.body && typeof opts.body !== 'string' && !isFormData
        ? JSON.stringify(opts.body)
        : opts.body,
  };

  console.debug(`[connectionService] ${init.method ?? 'GET'} ${url}`);

  const response = await fetch(url, init);
  if (response.status === 401 && token) {
    forceLogout();
  }
  const payload = await response.json().catch(() => ({}));

  console.debug(`[connectionService] ${response.status} ←`, payload);

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Finds the OTHER user's id in a connection record (not the logged-in user). */
const pickOtherUserId = (rec, myId) => {
  const candidates = [
    rec?.receiverId, rec?.requesterId, rec?.senderId, rec?.addresseeId,
    rec?.toUserId, rec?.fromUserId, rec?.targetUserId, rec?.connectedUserId,
    rec?.userId,
    rec?.receiver?.id, rec?.requester?.id, rec?.sender?.id,
    rec?.addressee?.id, rec?.connectedUser?.id, rec?.user?.id,
  ]
    .filter((v) => v != null)
    .map(String);

  return candidates.find((id) => id !== String(myId)) ?? null;
};

const isDeadStatus = (s) =>
  ['REJECTED', 'CANCELLED', 'CANCELED', 'DECLINED'].includes(String(s || '').toUpperCase());

// ─── User lookup (name + avatar) with in-memory cache ────────────────────────
const userCache = new Map();

const normaliseUser = (raw, id) => {
  const u =
    raw?.data?.profile ?? raw?.data?.user ?? raw?.profile ?? raw?.user ??
    raw?.data ?? raw ?? {};

  const name = u.fullName ?? u.name ?? u.displayName ?? u.username ?? null;
  const avatar = u.avatarUrl ?? u.avatar ?? u.profileImage ?? u.profilePhoto ?? '';
  if (!name && !avatar) return null;

  return { id: String(id), name, username: u.username ?? '', avatar };
};

// Candidate endpoints, tried in order. Keep only the one that works for you.
const USER_ENDPOINTS = (id) => [
  // `/api/profile/${id}`,
  // `/api/profile/user/${id}`,
  // `/api/users/${id}`,
  // `/api/profile/public/${id}`,
];

// ─── Public service ───────────────────────────────────────────────────────────
export const connectionService = {
  /**
 * Resolves { id, name, username, avatar } for a user ID.
 * Cached for the session. Returns null if no endpoint works.
 */
  async getUserSummary(userId) {
    const key = String(userId);
    if (userCache.has(key)) return userCache.get(key);

    for (const path of USER_ENDPOINTS(key)) {
      try {
        const res = await request(path, { method: 'GET' });
        const user = normaliseUser(res, key);
        if (user) {
          userCache.set(key, user);
          return user;
        }
      } catch {
        /* try the next endpoint */
      }
    }

    userCache.set(key, null);
    return null;
  },
  async getConnectionsCountForMe() {
    const list = await this.getMyConnections();
    return list.filter((c) => !isDeadStatus(c?.status)).length;
  },
  /**
   * Send a connection request to another user.
   *
   * POST /api/connections/request/:userId
   *
   * @param {string|number} userId  – The target user's backend ID.
   * @returns {Promise<object>}     – Backend response (includes the new connection record).
   * @throws {Error}                – On auth failure, duplicate request, or server error.
   */
  sendConnectionRequest(userId) {
    return request(`/api/connections/request/${userId}`, { method: 'POST' });
  },

  /**
   * Accept a received connection request.
   *
   * POST /api/connections/:id/accept
   *
   * @param {string|number} connectionId  – The connection record ID (not the other user's ID).
   * @returns {Promise<object>}
   */
  acceptConnectionRequest(connectionId) {
    return request(`/api/connections/${connectionId}/accept`, { method: 'POST' });
  },

  /**
   * Reject a received connection request.
   *
   * POST /api/connections/:id/reject
   *
   * @param {string|number} connectionId  – The connection record ID.
   * @returns {Promise<object>}
   */
  rejectConnectionRequest(connectionId) {
    return request(`/api/connections/${connectionId}/reject`, { method: 'POST' });
  },

  /**
   * Fetch connection requests received by the logged-in user.
   *
   * GET /api/connections/requests/received
   *
   * @returns {Promise<Array>}  – Array of received-request objects, or [] on failure.
   */
  async getReceivedRequests() {
    try {
      const result = await request('/api/connections/requests/received', { method: 'GET' });
      console.log('[received raw]', result);
      // Normalise common envelope shapes
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.requests)
            ? result.requests
            : [];
    } catch (err) {
      console.warn('[connectionService] GET received requests:', err.message);
      return [];
    }
  },

  /**
   * Fetch connection requests sent by the logged-in user.
   *
   * GET /api/connections/requests/sent
   *
   * @returns {Promise<Array>}  – Array of sent-request objects, or [] on failure.
   */
  async getSentRequests() {
    try {
      const result = await request('/api/connections/requests/sent', { method: 'GET' });
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.requests)
            ? result.requests
            : [];
    } catch (err) {
      console.warn('[connectionService] GET sent requests:', err.message);
      return [];
    }
  },

  /**
   * Fetch the logged-in user's accepted connections.
   *
   * GET /api/connections
   *
   * @returns {Promise<Array>}  – Array of accepted connection objects, or [] on failure.
   */
  async getMyConnections() {
    try {
      const result = await request('/api/connections', { method: 'GET' });
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.connections)
            ? result.connections
            : [];
    } catch (err) {
      console.warn('[connectionService] GET my connections:', err.message);
      return [];
    }
  },

  /**
   * Cancel a pending request or remove an accepted connection.
   *
   * DELETE /api/connections/:id
   *
   * @param {string|number} connectionId  – The connection record ID.
   * @returns {Promise<object>}
   * @throws {Error}                       – On auth failure or server error.
   */
  removeConnection(connectionId) {
    return request(`/api/connections/${connectionId}`, { method: 'DELETE' });
  },

  /**
 * Builds a Map<userId(string), { connectionId, status }> for the logged-in user.
 * status: 'pending' (I sent), 'incoming' (they sent me), 'connected' (accepted)
 * Never throws – returns an empty Map on failure.
 */
  async getConnectionMap(currentUserId) {
    const map = new Map();
    try {
      const [sent, received, accepted] = await Promise.all([
        this.getSentRequests(),
        this.getReceivedRequests(),
        this.getMyConnections(),
      ]);

      const add = (list, status) =>
        list.forEach((rec) => {
          if (isDeadStatus(rec?.status)) return;
          const userId = pickOtherUserId(rec, currentUserId);
          if (userId == null) return;
          map.set(userId, {
            connectionId: rec.id ?? rec.connectionId ?? null,
            status,
          });
        });

      // Order matters: later entries win, so "connected" overrides the others.
      add(received, 'incoming');
      add(sent, 'pending');
      add(accepted, 'connected');
    } catch (err) {
      console.warn('[connectionService] getConnectionMap failed:', err.message);
    }
    return map;
  },
};

export default connectionService;

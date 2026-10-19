/**
 * EVOLV Socket.IO Service
 *
 * Manages a singleton Socket.IO connection to the backend.
 * The connection is created once and shared; multiple components can
 * subscribe without opening multiple sockets.
 *
 * Backend origin  : VITE_API_BASE_URL
 *                   (e.g. https://evolve-backend-4lux.onrender.com)
 * Namespace       : default ("/")  — the gateway uses the default namespace.
 * Real-time event : "posts-batch"  — emitted as
 *                   Array<{ post: { id, caption, publishedAt, ... } }>
 *
 * Authentication  : The backend Socket.IO gateway reads the JWT from the
 *                   socket handshake `auth` object.  Do NOT rely on sending
 *                   an HTTP Authorization header — socket.io-client does not
 *                   forward that header to the WebSocket upgrade handshake.
 */

import { io } from 'socket.io-client';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'evolv_auth_token';

/**
 * Resolve the Socket.IO server origin from the Vite env variable.
 * The variable contains the full backend origin (no trailing slash, no /api).
 * Socket.IO connects to the origin directly on the default namespace.
 */
const SOCKET_ORIGIN =
  import.meta.env?.VITE_API_BASE_URL ??
  'https://evolve-backend-4lux.onrender.com';

// ─── Singleton state ──────────────────────────────────────────────────────────

/** The single shared socket instance (null = not yet created). */
let _socket = null;

/**
 * Consumer ref-count.  When it reaches 0 the socket is disconnected and
 * the singleton is cleared so the next mount creates a fresh connection.
 */
let _refCount = 0;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Read the stored JWT without triggering a React re-render. */
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY) ||
  null;

/**
 * Create the socket instance and attach permanent diagnostic listeners.
 * Called at most once per session; subsequent calls return the existing instance.
 */
function createSocket() {
  if (_socket) return _socket;

  _socket = io(SOCKET_ORIGIN, {
    /**
     * Pass the JWT in the handshake auth object so the backend gateway can
     * authenticate the socket connection (NestJS IoAdapter reads auth.token).
     */
    auth: { token: getToken() },

    // Reconnection mirrors the socket-test.cjs settings.
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,

    // Use the default Socket.IO path — only change this if the backend
    // mounts the gateway at a custom path.
    // path: '/socket.io',   // this is already the default

    // Prefer WebSocket transport; fall back to polling on restrictive networks.
    transports: ['websocket', 'polling'],
  });

  // ── Diagnostic listeners (always attached, never removed) ─────────────────
  _socket.on('connect', () => {
    console.log('[socketService] ✅ Connected  id:', _socket.id, ' origin:', SOCKET_ORIGIN);
  });

  _socket.on('connect_error', (err) => {
    console.warn('[socketService] ❌ Connection error:', err.message);
  });

  _socket.on('disconnect', (reason) => {
    console.log('[socketService] 🔌 Disconnected:', reason);
  });

  _socket.on('reconnect', (attempt) => {
    console.log('[socketService] 🔁 Reconnected after', attempt, 'attempt(s)');
  });

  return _socket;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const socketService = {
  /**
   * Increment the ref-count and ensure the socket is connected.
   *
   * Call this inside a useEffect when the component that needs real-time
   * updates mounts.  Pair with disconnect() in the cleanup function.
   *
   * @returns {import('socket.io-client').Socket} The shared socket instance.
   */
  connect() {
    _refCount += 1;
    const socket = createSocket();
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  },

  /**
   * Decrement the ref-count.  When it reaches 0 the socket is disconnected
   * and the singleton cleared so the next connect() produces a fresh one.
   *
   * Call this in the useEffect cleanup of the component that called connect().
   */
  disconnect() {
    _refCount = Math.max(0, _refCount - 1);
    if (_refCount === 0 && _socket) {
      _socket.disconnect();
      _socket = null;
      console.log('[socketService] 🗑️  Socket destroyed (ref-count reached 0).');
    }
  },

  /**
   * Subscribe to the `posts-batch` event.
   *
   * The backend emits this event as:
   *   Array<{ post: { id, caption, publishedAt, postKind, postType, media, ... } }>
   *
   * NOTE: This does NOT call connect() / disconnect().  The caller must
   * manage the lifecycle separately via connect() and disconnect().
   *
   * @param {(batch: Array<{post: object}>) => void} callback
   * @returns {() => void} Unsubscribe function — call it in useEffect cleanup.
   */
  onPostsBatch(callback) {
    if (!_socket) {
      console.warn('[socketService] onPostsBatch called before connect() — call connect() first.');
      return () => {};
    }
    _socket.on('posts-batch', callback);
    return () => {
      if (_socket) _socket.off('posts-batch', callback);
    };
  },

  /**
   * Subscribe to the `post-updates-batch` event.
   *
   * The backend emits this event as an array of update objects, each
   * describing a reaction or learned-state change for a specific post.
   * Observed payload shape (from backend PostsGateway):
   *   Array<{
   *     postId    : number | string,
   *     type      : 'reaction' | 'learned',
   *     userId    : number | string,
   *     reaction? : string,          // e.g. 'APPRECIATE' | 'HELPFUL'
   *     action    : 'added' | 'removed',
   *     counts?   : { APPRECIATE?: number, HELPFUL?: number, ... }
   *   }>
   *
   * NOTE: Does NOT call connect() / disconnect(). Caller manages lifecycle.
   *
   * @param {(batch: Array<object>) => void} callback
   * @returns {() => void} Unsubscribe function — call in useEffect cleanup.
   */
  onPostUpdatesBatch(callback) {
    if (!_socket) {
      console.warn('[socketService] onPostUpdatesBatch called before connect() — call connect() first.');
      return () => {};
    }
    _socket.on('post-updates-batch', callback);
    return () => {
      if (_socket) _socket.off('post-updates-batch', callback);
    };
  },

  /**
   * @returns {boolean} Whether the socket is currently connected.
   */
  isConnected() {
    return _socket?.connected ?? false;
  },
};

export default socketService;

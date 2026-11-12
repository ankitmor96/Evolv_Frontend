// src/services/adminService.js
// Admin-specific API service for the EVOLVS platform admin panel

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://evolve-backend-4lux.onrender.com';

const ADMIN_TOKEN_KEY = 'evolv_admin_token';
const ADMIN_USER_KEY = 'evolv_admin_user';
const DEMO_KEY = 'evolvs_admin_demo_session';

const getDemoSession = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(DEMO_KEY));
    return s?.role === 'admin' && s?.isDemo === true ? s : null;
  } catch {
    return null;
  }
};


const getToken = () =>
  localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY) || null;

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

const isAdminToken = (token) => {
  const claims = decodeJwt(token);
  if (!claims) return false;
  return (
    claims.role === 'admin' ||
    claims.role === 'ADMIN' ||
    (Array.isArray(claims.roles) && (claims.roles.includes('admin') || claims.roles.includes('ADMIN'))) ||
    claims.isAdmin === true
  );
};

const isTokenExpired = (token = getToken()) => {
  if (!token) return true;
  const claims = decodeJwt(token);
  if (!claims?.exp) return false;
  return Date.now() >= claims.exp * 1000 - 5000;
};

const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_USER_KEY);
  sessionStorage.removeItem(DEMO_KEY);
};

const request = async (path, opts = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const token = getToken();
  if (!token && getDemoSession()) {
    const err = new Error('Demo mode: backend data is not available.');
    err.isDemo = true;
    throw err;
  }

  if (!token || isTokenExpired(token)) {
    clearAdminSession();
   navigate('/admin/login')
    throw new Error('Admin session expired. Please log in again.');
  }

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

  const response = await fetch(url, init);

  if (response.status === 401 || response.status === 403) {
    clearAdminSession();
   navigate('/admin/login')
    throw new Error('Admin access denied.');
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = Array.isArray(payload.message)
      ? payload.message.join(' ')
      : payload.message || `Request failed: ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
};

const demoEmpty = (promise) =>
  promise.catch((err) => {
    if (err.isDemo) return { data: [], total: 0 };
    throw err;
  });

export const adminService = {
  isLoggedIn() {
    if (getDemoSession()) return true;
    const token = getToken();
    return !!token && !isTokenExpired(token) && isAdminToken(token);
  },
  async adminLogin(email, password, rememberMe = false) {
    const url = `${API_BASE_URL}/api/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = Array.isArray(payload.message)
        ? payload.message.join(' ')
        : payload.message || 'Login failed.';
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }
    const token = payload?.data?.accessToken ?? payload?.accessToken ?? null;
    if (!token) throw new Error('No access token received.');
    if (!isAdminToken(token)) {
      throw new Error('Access denied. You do not have admin privileges.');
    }
    const claims = decodeJwt(token);
    const user = {
      id: claims?.sub,
      name: payload?.data?.name ?? claims?.name ?? null,
      email: payload?.data?.email ?? claims?.email ?? email,
      role: claims?.role ?? 'admin',
    };
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(ADMIN_TOKEN_KEY, token);
    storage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    return { token, user };
  },

  getAdminUser() {
    const str =
      localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY);
    try {
      if (str) return JSON.parse(str);
    } catch {
      /* fall through */
    }
    const demo = getDemoSession();
    return demo ? { name: 'Admin', email: demo.email, role: demo.role } : null;
  },

  logout() {
    clearAdminSession();
    navigate('/admin/login')
  },

  isAdminToken,
  isTokenExpired: () => isTokenExpired(),

  // ── Dashboard Stats ────────────────────────────────────────────────
  async getDashboardStats() {
    try {
      return await request('/api/admin/stats');
    } catch {
      return null;
    }
  },

  async getAnalytics(period = 'monthly') {
    try {
      return await request(`/api/admin/analytics?period=${period}`);
    } catch {
      return null;
    }
  },

  // ── Users ──────────────────────────────────────────────────────────
  async getUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return demoEmpty(request(`/api/admin/users${qs ? `?${qs}` : ''}`));
  },
  async getUserById(id) {
    return request(`/api/admin/users/${id}`);
  },

  async suspendUser(id, reason = '') {
    return request(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: { reason } });
  },

  async reactivateUser(id) {
    return request(`/api/admin/users/${id}/reactivate`, { method: 'PATCH' });
  },

  async deleteUser(id) {
    return request(`/api/admin/users/${id}`, { method: 'DELETE' });
  },

  // ── Posts ──────────────────────────────────────────────────────────
  async getPosts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return demoEmpty(request(`/api/admin/posts${qs ? `?${qs}` : ''}`));
  },

  async deletePost(id) {
    return request(`/api/admin/posts/${id}`, { method: 'DELETE' });
  },

  async restorePost(id) {
    return request(`/api/admin/posts/${id}/restore`, { method: 'PATCH' });
  },
  async getReports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return demoEmpty(request(`/api/admin/reports${qs ? `?${qs}` : ''}`));
  },

  async resolveReport(id, action = {}) {
    return request(`/api/admin/reports/${id}/resolve`, { method: 'PATCH', body: action });
  },

  async dismissReport(id) {
    return request(`/api/admin/reports/${id}/dismiss`, { method: 'PATCH' });
  },

  async getPendingReportsCount() {
    try {
      const res = await request('/api/admin/reports?status=pending&limit=1');
      return res?.total ?? res?.data?.total ?? res?.count ?? 0;
    } catch {
      return 0;
    }
  },

  // ── Comments ──────────────────────────────────────────────────────
  async getComments(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return demoEmpty(request(`/api/admin/comments${qs ? `?${qs}` : ''}`));
  },

  async deleteComment(id) {
    return request(`/api/admin/comments/${id}`, { method: 'DELETE' });
  },

  // ── Connections ───────────────────────────────────────────────────
  async getConnectionStats() {
    try {
      return await request('/api/admin/connections');
    } catch {
      return null;
    }
  },

  // ── Notifications ─────────────────────────────────────────────────
  async sendNotification(data) {
    return request('/api/admin/notifications', { method: 'POST', body: data });
  },

  async getNotifications(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      return await request(`/api/admin/notifications${qs ? `?${qs}` : ''}`);
    } catch {
      return null;
    }
  },

  // ── Settings ──────────────────────────────────────────────────────
  async changePassword(currentPassword, newPassword) {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
  },

  async getPlatformConfig() {
    try {
      return await request('/api/admin/settings');
    } catch {
      return null;
    }
  },

  async getAuditLogs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      return await request(`/api/admin/audit-logs${qs ? `?${qs}` : ''}`);
    } catch {
      return null;
    }
  },
};


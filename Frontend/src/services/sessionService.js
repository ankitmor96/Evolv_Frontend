import { authService } from './authService.js';

const TOKEN_KEY = 'evolv_auth_token';

export const getStoredToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

/** True if there is no token, it is unreadable, or `exp` has passed. */
export const isTokenExpired = (token = getStoredToken()) => {
  if (!token) return true;
  const claims = decodeJwt(token);
  if (!claims?.exp) return false; // no exp claim: let the server decide
  return Date.now() >= claims.exp * 1000 - 5000; // 5s safety margin
};

/** Milliseconds until expiry (0 if already expired / no token). */
export const msUntilExpiry = (token = getStoredToken()) => {
  const claims = token ? decodeJwt(token) : null;
  if (!claims?.exp) return 0;
  return Math.max(0, claims.exp * 1000 - Date.now());
};

let redirecting = false;

/** Clears the session and sends the user to the login page (once). */
export const forceLogout = (reason = 'expired') => {
  if (redirecting) return;
  redirecting = true;

  authService.logout();
  sessionStorage.setItem('evolv-session-msg', reason);
  window.dispatchEvent(new Event('session-expired'));

  window.location.hash = '/login';
  window.dispatchEvent(new Event('navigated'));

  localStorage.removeItem('evolve-onboarding-draft');
  localStorage.removeItem('evolve-onboarding-draft-owner');
  setTimeout(() => { redirecting = false; }, 1000);
};
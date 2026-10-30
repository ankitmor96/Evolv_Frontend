const KEY = 'evolv-theme';           // 'light' | 'dark' | 'system'
const listeners = new Set();
const mq = window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePreference() {
  try { return localStorage.getItem(KEY) || 'light'; } catch { return 'light'; }
}

function resolve(pref) {
  return pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
}

export function applyTheme(pref = getThemePreference()) {
  const theme = resolve(pref);
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

export function setThemePreference(pref) {
  try { localStorage.setItem(KEY, pref); } catch { /* ignore */ }
  applyTheme(pref);
  listeners.forEach((l) => l());
}

export function subscribeTheme(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function initTheme() {
  applyTheme();
  mq.addEventListener('change', () => {
    if (getThemePreference() === 'system') applyTheme('system');
  });
}
import { useEffect } from 'react';

export function navigate(path, { replace = false } = {}) {
  const url = path.startsWith('/') ? path : `/${path}`;
  const current = window.location.pathname + window.location.search;
  if (current === url) return;

  window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  window.dispatchEvent(new Event('navigated')); // App.jsx already listens to this
}

export function Redirect({ to }) {
  // Redirects after render, which avoids setState-during-render warnings
  useEffect(() => { navigate(to, { replace: true }); }, [to]);
  return null;
}
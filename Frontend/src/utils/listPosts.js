const KEY = 'evolv-list-posts';

/** Read the list saved by a profile page. Does NOT delete it, so React double-runs are safe. */
export function takeListPosts() {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

/** Call when leaving the viewer. */
export function clearListPosts() {
  sessionStorage.removeItem(KEY);
}
import { homePostService } from './homePostService.js';
import { getPostReactions, getPostLearned, normaliseReactions } from './reactionTotals.js';
import { forceLogout } from './sessionService.js';

const ORIGIN =
  import.meta.env?.VITE_API_BASE_URL ?? 'https://evolve-backend-4lux.onrender.com';

const getToken = () =>
  localStorage.getItem('evolv_auth_token') ||
  sessionStorage.getItem('evolv_auth_token') ||
  null;

async function getJson(path, { limit, cursor }) {
  const token = getToken();
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cursor) qs.set('cursor', cursor);

  const res = await fetch(`${ORIGIN}${path}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401 && token) forceLogout();
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);

  return {
    posts: (Array.isArray(json.data) ? json.data : []).map((p) =>
      homePostService._normalisePost(p)
    ),
    message: json.message ?? '',
    totalConnections: json.totalConnections ?? 0,
    totalPosts: json.totalPosts ?? 0,
    hasMore: Boolean(json.hasMore),
    nextCursor: json.nextCursor ?? null,
  };
}

/** Called by the Reels / Image viewers: returns the one post clicked on Discover. */
export async function takeSinglePost() {
  const raw = sessionStorage.getItem('evolv-single-post');
  if (!raw) return null;
  sessionStorage.removeItem('evolv-single-post');

  let post;
  try { post = JSON.parse(raw); } catch { return null; }
  if (!post?.id) return null;

  const [r, l, c] = await Promise.allSettled([
    getPostReactions(post.id),
    getPostLearned(post.id),
    homePostService.getCommentCount(post.id),
  ]);

  return {
    ...post,
    ...(r.status === 'fulfilled' ? normaliseReactions(r.value, post.id) : {}),
    ...(l.status === 'fulfilled' ? l.value : {}),
    ...(c.status === 'fulfilled' ? { comments: c.value } : {}),
  };
}

export const discoverService = {
  getConnectionPosts({ limit = 12, cursor = null } = {}) {
    return getJson('/api/discover/connections/posts', { limit, cursor });
  },
  getSkillPosts({ skillId, limit = 12, cursor = null }) {
    return getJson(`/api/discover/skills/${skillId}/posts`, { limit, cursor });
  },
};
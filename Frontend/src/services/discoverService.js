import { homePostService } from './homePostService.js';
import { getPostReactions, getPostLearned, normaliseReactions } from './reactionTotals.js';
import { forceLogout } from './sessionService.js';
import { userProfileService } from './userProfileService.js';

const ORIGIN =
  import.meta.env?.VITE_API_BASE_URL ?? 'https://evolve-backend-4lux.onrender.com';

const getToken = () =>
  localStorage.getItem('evolv_auth_token') ||
  sessionStorage.getItem('evolv_auth_token') ||
  null;

// ── Fill in creator name/avatar when the API only sends userId ──
const profileCache = new Map();

function loadProfile(userId) {
  const key = String(userId);
  if (!profileCache.has(key)) {
    const promise = userProfileService.getUserProfile(userId).catch(() => null);
    profileCache.set(key, promise);
    // don't keep failed lookups, so they can be retried
    promise.then((p) => { if (!p) profileCache.delete(key); });
  }
  return profileCache.get(key);
}

export async function enrichCreators(posts) {
  try {
    const ids = [
      ...new Set(
        posts
          .filter((p) => !p.creator?.name && p.creator?.id != null)
          .map((p) => String(p.creator.id))
      ),
    ];
    if (ids.length === 0) return posts;

    const profiles = await Promise.all(ids.map(loadProfile));
    const byId = new Map(ids.map((id, i) => [id, profiles[i]]));

    return posts.map((p) => {
      const prof = byId.get(String(p.creator?.id));
      if (!prof) return p;
      return {
        ...p,
        creator: {
          ...p.creator,
          name: prof.name || prof.username || p.creator.name,
          username: prof.username || p.creator.username,
          avatar: prof.avatar || p.creator.avatar,
          field: prof.field || p.creator.field,
        },
      };
    });
  } catch (err) {
    console.warn('[enrichCreators] failed, showing posts without profiles:', err.message);
    return posts; // never block the posts
  }
}

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

  const normalised = (Array.isArray(json.data) ? json.data : []).map((p) =>
    homePostService._normalisePost(p)
  );
  const posts = await enrichCreators(normalised);

  return {
    posts,
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
import { authService } from './authService.js';

// CHANGED: same base URL as homePostService.js
const ORIGIN =
  import.meta.env?.VITE_API_BASE_URL ?? 'https://evolve-backend-4lux.onrender.com';
const API_BASE = `${ORIGIN}/api`;

const getToken = () =>
  authService.getToken?.() ??
  localStorage.getItem('evolv_auth_token') ??
  sessionStorage.getItem('evolv_auth_token');

// ── NEW: per-user local memory of what I reacted to ─────────────────────────
const myId = () => {
  const u = authService.getCurrentUser?.();
  return u?.id ?? u?.userId ?? u?._id ?? 'anon';
};
const CACHE_KEY = () => `evolv-my-reactions:${myId()}`;

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY())) || {}; }
  catch { return {}; }
};

/** type: 'APPRECIATE' | 'HELPFUL' | 'LEARNED' */
export function setMyReaction(postId, type, value) {
  const all = readCache();
  const key = String(postId);
  all[key] = { ...(all[key] || {}), [type]: Boolean(value) };
  try { localStorage.setItem(CACHE_KEY(), JSON.stringify(all)); } catch { /* ignore */ }
}

/** Flags only (no counts). Used when the reactions request fails. */
export function getCachedFlags(postId) {
  const c = readCache()[String(postId)] || {};
  return {
    appreciated: Boolean(c.APPRECIATE),
    helpful: Boolean(c.HELPFUL),
    learned: Boolean(c.LEARNED),
  };
}

// ── API ─────────────────────────────────────────────────────────────────────
export async function getPostReactions(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/reactions`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Reactions failed for post ${postId}`);
  const json = await res.json();
  if (!json?.success) throw new Error('Reactions response not successful');
  return json;
}

export async function getPostLearned(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/learned`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Learned failed for post ${postId}`);
  const json = await res.json();
  if (!json?.success) throw new Error('Learned response not successful');

  const learned = Boolean(json.isLearned);
  const learnedCount = Number(json.learningCount) || 0;
  setMyReaction(postId, 'LEARNED', learned); // keep cache in sync
  return { learned, learnedCount };
}

export function sumReactionTotals(items = []) {
  const list = Array.isArray(items) ? items : [];
  return list.reduce(
    (acc, r) => ({
      appreciation: acc.appreciation + (Number(r?.counts?.APPRECIATE ?? r?.appreciations) || 0),
      helpful: acc.helpful + (Number(r?.counts?.HELPFUL ?? r?.helpfulCount) || 0),
      learned: acc.learned + (Number(r?.counts?.LEARNED ?? r?.learnedCount) || 0),
    }),
    { appreciation: 0, helpful: 0, learned: 0 }
  );
}

const typeOf = (x) => String(x?.reactionType ?? x?.type ?? x ?? '').toUpperCase();

const hasReaction = (my, type) => {
  if (!my) return false;
  if (typeof my === 'string') return my.toUpperCase() === type;
  if (Array.isArray(my)) return my.map(typeOf).includes(type);
  if (typeof my === 'object') {
    if (my[type] === true) return true;
    if (typeOf(my) === type) return true;
    if (Array.isArray(my.types)) return my.types.map(typeOf).includes(type);
  }
  return false;
};

/** CHANGED: now takes postId and merges the local memory with the server data */
export function normaliseReactions(json = {}, postId) {
  const counts = json.counts ?? {};

  const hasServerState =
    'myReaction' in json || 'myReactions' in json || 'userReaction' in json ||
    'userReactions' in json || 'reactedByMe' in json;

  const my =
    json.myReactions ?? json.myReaction ?? json.userReactions ??
    json.userReaction ?? json.reactedByMe ?? null;

  const cached = getCachedFlags(postId);

  // Server is the source of truth; cache is only a fallback if the field is missing
  const appreciated = hasServerState ? hasReaction(my, 'APPRECIATE') : cached.appreciated;
  const helpful = hasServerState ? hasReaction(my, 'HELPFUL') : cached.helpful;
  const learned = hasServerState
    ? hasReaction(my, 'LEARNED') || Boolean(json.myLearned ?? json.isLearned ?? json.learned)
    : cached.learned;

  // Keep the cache in sync with what the server says
  if (hasServerState) {
    setMyReaction(postId, 'APPRECIATE', appreciated);
    setMyReaction(postId, 'HELPFUL', helpful);
  }

  return {
    appreciations: Number(counts.APPRECIATE) || 0,
    helpfulCount: Number(counts.HELPFUL) || 0,
    appreciated,
    helpful,
  };
}
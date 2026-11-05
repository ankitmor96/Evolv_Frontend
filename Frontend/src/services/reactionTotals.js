
import { authService } from './authService.js';

const API_BASE = 'https://evolve-backend-4lux.onrender.com/api';


export async function getPostReactions(postId) {
  const token =
    authService.getToken?.() ??
    localStorage.getItem('evolv_auth_token') ??
    sessionStorage.getItem('evolv_auth_token');
  const res = await fetch(`${API_BASE}/posts/${postId}/reactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Reactions failed for post ${postId}`);
  const json = await res.json();
  if (!json?.success) throw new Error('Reactions response not successful');
  return json;
}

export function sumReactionTotals(items = []) {
  const list = Array.isArray(items) ? items : [];

  return list.reduce(
    (acc, r) => ({
      appreciation:
        acc.appreciation + (Number(r?.counts?.APPRECIATE ?? r?.appreciations) || 0),
      helpful:
        acc.helpful + (Number(r?.counts?.HELPFUL ?? r?.helpfulCount) || 0),
      learned:
        acc.learned + (Number(r?.counts?.LEARNED ?? r?.learnedCount) || 0),
    }),
    { appreciation: 0, helpful: 0, learned: 0 }
  );
}
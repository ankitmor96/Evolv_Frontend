const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';
const TOKEN_KEY = 'evolv_auth_token';

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;

const PROFILE_ENDPOINT = (id) => `/api/profile/${id}/complete`;
const CONNECTIONS_COUNT_ENDPOINT = null;

async function request(path) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function toSkillList(src) {
  if (Array.isArray(src)) {
    return src.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
  }
  if (typeof src === 'string' && src.trim()) {
    return src.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return null;
}

const pickNumber = (...vals) => {
  for (const v of vals) {
    if (v != null && v !== '' && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
};

const PROFILE_DETAILS_ENDPOINT = (id) => `/api/skills/users/${id}/profile-details`;

const itemName = (i) =>
  typeof i === 'string'
    ? i
    : i?.name ?? i?.skill?.name ?? i?.skillName ?? i?.title ?? i?.category?.name ?? null;

const firstArray = (obj, keys) => {
  for (const k of keys) if (Array.isArray(obj?.[k])) return obj[k];
  return [];
};

const toNames = (arr) => [...new Set(arr.map(itemName).filter(Boolean))];

function normaliseDetails(raw) {
  const root = raw?.data ?? raw ?? {};

  const identities = firstArray(root, ['identities']);
  const primary = identities.find((i) => i.isPrimary) ?? identities[0];

  const skillRows = firstArray(root, ['skills', 'userSkills']);
  const byType = (re) =>
    toNames(skillRows.filter((r) => re.test(String(r.relationshipType ?? ''))));

  return {
    roles: identities.map((i) => i.identityType?.name).filter(Boolean),
    primaryRole: primary?.identityType?.name ?? null,
    learning: byType(/learn/i),
    expertise: byType(/expert|proficient|know|teach/i),
    curiosity: toNames(firstArray(root, ['curiosities', 'curiosity', 'curiousAbout'])),
    skills: toNames(skillRows),
  };
}

function normaliseProfile(raw, fallbackId) {
  const root = raw?.data ?? raw ?? {};
  const p = root.profile ?? root.user ?? root;

  const connectionsCount = pickNumber(
    p.connectionsCount, p.connectionCount, p.connections_count,
    root.connectionsCount, root.connectionCount,
    p.stats?.connections, p.stats?.connectionsCount,
    root.stats?.connections, root.stats?.connectionsCount,
    p._count?.connections,
    Array.isArray(p.connections) ? p.connections.length : null,
    Array.isArray(root.connections) ? root.connections.length : null,
  );

  return {
    id: p.id ?? p.userId ?? p._id ?? fallbackId,
    name: p.fullName ?? p.name ?? p.username ?? 'User',
    username: p.username ?? '',
    avatar: p.avatarUrl ?? p.avatar ?? p.profileImage ?? '',
    bio: p.bio ?? p.about ?? p.description ?? '',
    field: p.role ?? p.field ?? p.headline ?? 'Community Member',
    connectionsCount,
    skills: toSkillList(p.skills ?? root.skills ?? p.interests),
  };
}

export const userProfileService = {
  async getUserProfile(userId) {
    if (!PROFILE_ENDPOINT) return null;
    const raw = await request(PROFILE_ENDPOINT(userId));
    return normaliseProfile(raw, userId);
  },

  async getConnectionsCount(userId) {
    if (!CONNECTIONS_COUNT_ENDPOINT) return null;
    const raw = await request(CONNECTIONS_COUNT_ENDPOINT(userId));
    const d = raw?.data ?? raw;
    const n = d?.count ?? d?.connectionsCount ?? d?.total;
    return Number.isFinite(Number(n)) ? Number(n) : null;
  },
  async getProfileDetails(userId) {
    const raw = await request(PROFILE_DETAILS_ENDPOINT(userId));
    return normaliseDetails(raw);
  },
};


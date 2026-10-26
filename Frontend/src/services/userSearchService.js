const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "evolv_auth_token";

const SEARCH_ENDPOINT = "/api/users/search";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;

const normaliseUser = (u) => ({
  id: u.id ?? u.userId ?? u._id,
  name: u.fullName ?? u.name ?? u.displayName ?? u.username ?? "",
  username: u.username ?? u.email?.split("@")[0] ?? "",
  avatar: u.avatarUrl ?? u.avatar ?? u.profileImage ?? "",
  field: u.field ?? u.role ?? "Community Member",
});

export const userSearchService = {
  async searchUsers(query) {
    const q = query.trim();
    if (!q) return [];

    const token = getToken();
    const res = await fetch(
      `${API_BASE_URL}${SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}`,
      {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.message || `Search failed (${res.status})`);

    const list = Array.isArray(payload)
      ? payload
      : payload?.data ?? payload?.users ?? payload?.results ?? [];

    return (Array.isArray(list) ? list : []).map(normaliseUser).filter((u) => u.id != null);
  },
};
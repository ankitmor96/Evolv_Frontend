const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "evolv_auth_token";

let inflight = null;

/** Call after creating/updating the profile so the next read is fresh. */
export const invalidateProfile = () => {
  inflight = null;
};

/**
 * GET /api/profile, shared by every caller.
 * Returns the profile object, or null if the user has none yet.
 */
export const fetchProfileOnce = () => {
  if (inflight) return inflight;

  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

  inflight = fetch(`${API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      if (res.status === 401) {
        const err = new Error("Unauthorized");
        err.status = 401;
        throw err;
      }
      if (res.status === 404) return null;
      if (!res.ok) {
        const err = new Error(`Request failed: ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const body = await res.json().catch(() => null);
      const data = body?.data ?? body;
      const profile = data?.profile ?? data;
      return profile && typeof profile === "object" && Object.keys(profile).length
        ? profile
        : null;
    })
    .finally(() => {
      // keep the result for 1.5s so StrictMode's double effect and
      // the second caller reuse it, then allow a fresh request
      setTimeout(() => {
        inflight = null;
      }, 1500);
    });

  return inflight;
};
/**
 * EVOLV Home Tab Service
 *
 * Fetches the skill/category tabs for the Home Feed from:
 *   GET /api/home/tabs
 *
 * Requires authentication (Bearer token).
 *
 * Response shape (verified against backend):
 *   Array of skill objects:
 *     { id, name, slug, categoryId, categoryName, categorySlug }
 *
 * This service maps the response into the flat string array that
 * InterestTabs expects, prefixed with the fixed "For You" and
 * "Following" tabs (which are not returned by the API).
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "evolv_auth_token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY) ||
  null;

/**
 * Fetch home tabs from the backend.
 *
 * @returns {Promise<Array<{id: number, name: string, slug: string, categoryId: number, categoryName: string, categorySlug: string}>>}
 *   Raw skill/tab objects from the backend.
 * @throws {Error} on network failures or non-2xx responses.
 */
export async function fetchHomeTabs() {
  const token = getToken();
  const url = `${API_BASE_URL}/api/home/tabs`;

  console.debug("[homeTabService] GET", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  console.debug(`[homeTabService] ${response.status} ←`, payload);

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message ||
        payload?.error ||
        `Home Tabs request failed (${response.status})`;

    const err = new Error(message);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

 
  // Support both the object response and array response.
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  // Preserve tabs and selectedSkills from the API.
  return payload;

}

/**
 * Map the raw backend tab objects into the flat label strings that
 * InterestTabs expects, de-duplicated by category name.
 *
 * Strategy: group skills by categoryName, then produce one tab label per
 * unique categoryName.  The fixed "For You" and "Following" tabs are
 * prepended by the caller.
 *
 * @param {Array} tabs  – raw backend objects from fetchHomeTabs()
 * @returns {string[]}  – unique category name labels, e.g. ["Technology", "Design", …]
 */
export function mapTabsToLabels(tabs) {
  if (!Array.isArray(tabs) || tabs.length === 0) return [];

  const seen = new Set();
  const labels = [];

  for (const tab of tabs) {
    const label = tab.categoryName || tab.name || "";
    if (label && !seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }

  return labels;
}

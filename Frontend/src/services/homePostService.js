/**
 * EVOLV Home Post Service
 *
 * Handles Home Feed post creation and fetching.
 * Uses the same API base URL and token as profileService.js.
 *
 * Verified endpoint status (checked against live backend):
 *   POST /api/posts  → 404 (backend route not yet implemented)
 *   GET  /api/posts  → 404 (backend route not yet implemented)
 *
 * When the backend adds these routes the service will work automatically.
 * Until then:
 *   - createPost() will throw with a clear 404 message (shown in the UI).
 *   - getPosts()   will return [] so the feed falls back to mock data.
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

const TOKEN_KEY = "evolv_auth_token";

// Verified paths — both currently return 404 from the live backend.
const POST_ENDPOINT = "/api/posts";
const GET_ENDPOINT = "/api/posts";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY) ||
  null;

/**
 * Reusable request handler.
 * Supports JSON and FormData requests.
 */
const request = async (path, options = {}) => {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  // Let the browser set Content-Type for FormData,
  // including the required multipart boundary.
  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message ||
        payload?.error ||
        `Request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const homePostService = {
  /**
   * Create a post with caption and optional media.
   *
   * Verified: POST /api/posts currently returns 404 on the live backend.
   * When the backend adds the route, this will work automatically.
   *
   * @param {object} postData
   * @param {string} postData.type
   * @param {string} postData.caption
   * @param {string} postData.content
   * @param {string} postData.title
   * @param {string} postData.description
   * @param {File[]} postData.files
   */
  async createPost(postData) {
    if (!getToken()) {
      throw new Error("Please log in before creating a post.");
    }

    const formData = new FormData();

    formData.append("type", postData.type || "text");
    formData.append("caption", postData.caption || "");
    formData.append("content", postData.content || "");
    formData.append("title", postData.title || "");
    formData.append("description", postData.description || "");

    (postData.files || []).forEach((file) => {
      formData.append("files", file);
    });

    console.debug("[homePostService] Creating post");

    return request(POST_ENDPOINT, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Fetch posts for the Home Feed.
   *
   * Verified backend status: GET /api/posts returns 404 (endpoint not yet
   * implemented on the backend). Returns [] on 404 so the feed can fall back
   * to mock data gracefully. Re-throws auth and server errors.
   *
   * @returns {Promise<Array>} Array of post objects from backend, or [] on 404.
   */
  async getPosts() {
    try {
      const result = await request(GET_ENDPOINT, {
        method: "GET",
      });
      // Backend may wrap array in { data } or { posts } envelope
      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      if (Array.isArray(result?.posts)) return result.posts;
      return [];
    } catch (err) {
      if (err.status === 404) {
        console.warn(
          "[homePostService] GET /api/posts returned 404 — " +
            "backend endpoint not yet available. Feed will use mock data."
        );
        return [];
      }
      // Re-throw auth and server errors so the feed can show them.
      throw err;
    }
  },
};

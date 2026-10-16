/**
 * EVOLV Home Post Service
 *
 * Handles Home Feed post creation and fetching.
 * Uses the same API base URL and token as profileService.js.
 *
 * Verified endpoint status (confirmed via Postman):
 *   POST /api/posts        → 201 Created  (image post, field: "image")
 *   POST /api/posts/video  → 201 Created  (video post, field: "video")
 *   GET  /api/posts        → 404 (backend route not yet implemented)
 *
 * API base URL is the backend origin (no trailing /api):
 *   VITE_API_BASE_URL=http://localhost:3000   (local dev, via .env.local)
 *   VITE_API_BASE_URL=https://evolve-backend-4lux.onrender.com  (production)
 *
 * Endpoints are constructed as ${API_BASE_URL}/api/posts etc.
 * Never append /api twice.
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

const TOKEN_KEY = "evolv_auth_token";

// ─── Verified endpoint paths ──────────────────────────────────────────────────
/** POST /api/posts — image post (multipart field: "image") */
const IMAGE_POST_ENDPOINT = "/api/posts";

/** POST /api/posts/video — video/reel post (multipart field: "video") */
const VIDEO_POST_ENDPOINT = "/api/posts/video";

/** GET /api/posts — not yet implemented; returns 404 */
const GET_ENDPOINT = "/api/posts";

// ─── Token helper ─────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY) ||
  null;

// ─── Reusable fetch wrapper ───────────────────────────────────────────────────
/**
 * Low-level request handler shared by all methods.
 * - Automatically injects Authorization: Bearer <token>.
 * - Does NOT set Content-Type for FormData — lets the browser
 *   generate the multipart boundary automatically.
 * - Throws a structured Error({ message, status, payload }) on non-2xx.
 */
const request = async (path, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  // Browser must set Content-Type for FormData to include the boundary.
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

// ─── Response normaliser ──────────────────────────────────────────────────────
/**
 * Extract the canonical post object from the backend envelope.
 * Handles { post }, { data: { post } }, { data }, and bare objects.
 */
const unwrapPost = (payload) =>
  payload?.post ?? payload?.data?.post ?? payload?.data ?? payload;

export const homePostService = {
  // ── Image post ──────────────────────────────────────────────────────────────
  /**
   * @param {string} caption   – Post caption.
   * @param {File}   imageFile – The selected image File.
   * @returns {Promise<object>} Normalised feed-post object ready for the feed.
   * @throws {Error} On auth failure, network error, or server error.
   */


  // Fetch document posts for Discover
  async getDocumentPosts() {
    const token =
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY);
    const response = await fetch(
        `${API_BASE_URL}/api/posts/document`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(token
                    ? { Authorization: `Bearer ${token}` }
                    : {}),
            },
        }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result?.message || `Failed to fetch documents (${response.status})`
        );
    }

    // Support common API response formats.
    const posts = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.posts)
            ? result.posts
            : Array.isArray(result?.documents)
              ? result.documents
              : Array.isArray(result?.data?.posts)
                ? result.data.posts
                : [];

    return posts;
  },

  async createImagePost(caption, imageFile) {
    if (!getToken()) {
      throw new Error("Please log in before creating a post.");
    }
    if (!imageFile) {
      throw new Error("Please select an image to upload.");
    }

    const formData = new FormData();
    formData.append("caption", caption ?? "");
    // Field name verified against Postman: must be "image", not "images" or "files".
    formData.append("image", imageFile);

    console.debug("[homePostService] POST", IMAGE_POST_ENDPOINT, "— image post");

    const payload = await request(IMAGE_POST_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    return this._normalisePost(payload, "image");
  },

  // ── Video / reel post ────────────────────────────────────────────────────────
  /**
   * Create a video (reel) post.
   *
   * Verified: POST /api/posts/video → 201 Created
   * Body: multipart/form-data
   *   caption  – text
   *   video    – File (the actual File object, not a URL)
   *
   * @param {string} caption   – Post caption.
   * @param {File}   videoFile – The selected video File.
   * @returns {Promise<object>} Normalised feed-post object ready for the feed.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async createVideoPost(caption, videoFile) {
    if (!getToken()) {
      throw new Error("Please log in before creating a post.");
    }
    if (!videoFile) {
      throw new Error("Please select a video to upload.");
    }

    const formData = new FormData();
    formData.append("caption", caption ?? "");
    // Field name verified against Postman: must be "video".
    formData.append("video", videoFile);

    console.debug("[homePostService] POST", VIDEO_POST_ENDPOINT, "— video post");

    const payload = await request(VIDEO_POST_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    return this._normalisePost(payload, "video");
  },

  // ── Legacy generic createPost (non-media types) ──────────────────────────────
  /**
   * Create a text / article / question / achievement post.
   *
   * These types do not use the confirmed image/video endpoints.
   * They continue to POST to /api/posts with a JSON-like FormData body.
   * When the backend adds proper support the mapping can be tightened.
   *
   * @param {object} postData
   * @param {string} postData.type
   * @param {string} postData.caption
   * @param {string} postData.content
   * @param {string} postData.title
   * @param {string} postData.description
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

    console.debug("[homePostService] POST", IMAGE_POST_ENDPOINT, "— text/article post");

    return request(IMAGE_POST_ENDPOINT, {
      method: "POST",
      body: formData,
    });
  },

  // ── Feed fetch ───────────────────────────────────────────────────────────────
  /**
   * Fetch posts for the Home Feed.
   *
   * GET /api/posts is not yet implemented (returns 404).
   * Returns [] on every failure so the feed always falls back to static data.
   *
   * @returns {Promise<Array>} Backend post array, or [] on any failure.
   */
  async getPosts() {
    try {
      const result = await request(GET_ENDPOINT, { method: "GET" });
      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      if (Array.isArray(result?.posts)) return result.posts;
      return [];
    } catch (err) {
      if (!err.status) {
        console.warn(
          "[homePostService] GET /api/posts — network / CORS failure. " +
            "If you see a CORS error above, the backend must add the " +
            "frontend origin to its Access-Control-Allow-Origin header. " +
            "Feed will display static mock data. Detail:",
          err.message
        );
      } else if (err.status === 404) {
        console.warn(
          "[homePostService] GET /api/posts returned 404 — " +
            "backend endpoint not yet implemented. Feed will use mock data."
        );
      } else if (err.status === 401 || err.status === 403) {
        console.warn(
          `[homePostService] GET /api/posts returned ${err.status} — ` +
            "auth error. Feed will display static mock data.",
          err.message
        );
      } else {
        console.warn(
          `[homePostService] GET /api/posts returned ${err.status} — ` +
            "server error. Feed will display static mock data.",
          err.message
        );
      }
      return [];
    }
  },

  // ── Internal: response → feed-post normaliser ─────────────────────────────
  /**
   * Map a raw backend post response into the shape HomeFeed's FeedPost
   * component expects.
   *
   * Backend response (confirmed fields from Postman):
   *   postId        – post identifier (may also appear as _id / id)
   *   mediaType     – "image" | "video"
   *   mediaUrl      – Cloudinary (or other CDN) URL of the uploaded file
   *   thumbnailUrl  – Cloudinary thumbnail for video posts (may be absent)
   *   caption       – echoed caption string
   *   createdAt     – ISO timestamp
   *
   * @param {object} payload    – Raw JSON from the backend.
   * @param {"image"|"video"} mediaType – Declared by the caller (not trusted alone).
   * @returns {object} Feed-post shaped object.
   */
  _normalisePost(payload, mediaType) {
    const p = unwrapPost(payload);

    // Prefer backend-declared mediaType, fall back to caller's declaration.
    const resolvedMediaType = p?.mediaType || mediaType;
    const isVideo = resolvedMediaType === "video";

    // Stable ID: postId (Postman field) → _id → id → fallback timestamp.
    const id = p?.postId || p?._id || p?.id || `local-${Date.now()}`;

    // Media URL from Cloudinary (or other CDN).
    const mediaSrc =
      p?.mediaUrl ||
      p?.media?.url ||
      p?.imageUrl ||
      p?.videoUrl ||
      "";

    // Thumbnail / poster — only meaningful for videos.
    const mediaPoster = p?.thumbnailUrl || p?.media?.poster || "";

    return {
      id,
      type: isVideo ? "reel" : "post",
      caption: p?.caption ?? "",
      tags: Array.isArray(p?.tags) ? p.tags : [],
      category: p?.category || p?.skillName || "Discover",
      timestamp: p?.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "Just now",

      creator: {
        name:
          p?.creator?.name ||
          p?.user?.name ||
          p?.author?.name ||
          "You",
        username:
          p?.creator?.username || p?.user?.username || "",
        field:
          p?.creator?.field || p?.user?.field || "Community Member",
        avatar:
          p?.creator?.avatar ||
          p?.creator?.profileImage ||
          p?.user?.avatar ||
          "",
      },

      media: {
        type: isVideo ? "video" : mediaSrc ? "image" : "text",
        src: mediaSrc,
        ...(isVideo && mediaPoster ? { poster: mediaPoster } : {}),
      },

      // Interaction state — all false / zero on creation.
      liked: false,
      saved: false,
      followed: false,
      appreciated: false,
      appreciations: 0,
      helpful: false,
      helpfulCount: 0,
      learned: false,
      learnedCount: 0,
      comments: 0,
      likes: 0,
    };
  },
};

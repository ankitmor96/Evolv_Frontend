/**
 * EVOLV Home Post Service
 *
 * Handles Home Feed post creation and fetching.
 * Uses the same API base URL and token as profileService.js.
 *
 * Verified endpoint status (confirmed via Postman):
 *   POST /api/posts        → 201 Created  (image post, field: "image")
 *   POST /api/posts/video  → 201 Created  (video post, field: "video")
 *   GET  /api/posts        → 404 (not yet implemented; kept for fallback)
 *   GET  /api/posts/feed   → 200 OK  (paginated public feed, cursor-based)
 *
 * Feed response shape (confirmed via Postman):
 *   {
 *     data: [
 *       {
 *         id, postKind, postType, publishedAt, status, visibility, userId,
 *         media: [{ id, mediaType, mediaUrl, altText, position, thumbnailUrl }]
 *       }
 *     ],
 *     pagination: { limit, hasMore, nextCursor }
 *   }
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

/** GET /api/posts — not yet implemented; returns 404 (kept for legacy getPosts()) */
const GET_ENDPOINT = "/api/posts";

/**
 * GET /api/posts/feed — paginated public feed (confirmed via Postman)
 * Query params: cursor=<id>  (omit for first page)
 * Response: { data: [...], pagination: { limit, hasMore, nextCursor } }
 */
const FEED_ENDPOINT = "/api/posts/feed";

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
// const request = async (path, options = {}) => {
//   const token = getToken();
//   const isFormData = options.body instanceof FormData;

//   const headers = {
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...(!isFormData ? { "Content-Type": "application/json" } : {}),
//     ...(options.headers ?? {}),
//   };

//   // Browser must set Content-Type for FormData to include the boundary.
//   if (isFormData) {
//     delete headers["Content-Type"];
//     delete headers["content-type"];
//   }

//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     ...options,
//     headers,
//   });

//   const payload = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     const message = Array.isArray(payload?.message)
//       ? payload.message.join(" ")
//       : payload?.message ||
//         payload?.error ||
//         `Request failed (${response.status})`;

//     const error = new Error(message);
//     error.status = response.status;
//     error.payload = payload;
//     throw error;
//   }

//   return payload;
// };

// ─── Response normaliser ──────────────────────────────────────────────────────
/**
 * 
 * Extract the canonical post object from the backend envelope.
 * Handles { post }, { data: { post } }, { data }, and bare objects.
 */


const request = async (path, options = {}) => {
  const startedAt = Date.now();
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const controller = new AbortController();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  // Let the browser set the multipart boundary.
  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  const timeoutId = setTimeout(() => {
    console.error(
      `[VIDEO DEBUG] Request timed out: ${path}`,
      { elapsedMs: Date.now() - startedAt }
    );
    controller.abort();
  }, 120000);

  try {
    console.log("[VIDEO DEBUG] Request started", {
      url: `${API_BASE_URL}${path}`,
      method: options.method || "GET",
      bodyType: isFormData ? "FormData" : "JSON",
      time: new Date().toISOString(),
    });

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    console.log('[homePostService] Response received', {
      status: response.status,
      elapsedMs: Date.now() - startedAt,
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
  } catch (error) {
    console.error("[VIDEO DEBUG] Request failed", {
      message: error.message,
      name: error.name,
      elapsedMs: Date.now() - startedAt,
    });

    if (error.name === "AbortError") {
      throw new Error(
        "Request timed out after 2 minutes. Check backend logs."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

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
      throw new Error("Please log in first.");
    }

    // Documents need a dedicated backend upload endpoint.
    if (postData.type === "document") {
      const file = postData.file;

      if (!(file instanceof File)) {
        throw new Error("Please select a valid document");
      }

      const formData = new FormData();
      formData.append("document", file);
      formData.append("caption", postData.caption || "");

      return request("/api/posts/document", {
        method: "POST",
        body: formData,
      });
    }

    if (postData.type === "video" || postData.type === "reel") {
      return this.createVideoPost(
        postData.caption,
        postData.videoFile
      );
    }

    if (postData.type === "image") {
      return this.createImagePost(
        postData.caption,
        postData.imageFile
      );
    }

    throw new Error("Unsupported post type.");
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

  // ── Reactions ─────────────────────────────────────────────────────────────
  /**
   * GET /api/posts/:postId/reactions
   * Returns reaction counts and the current user's reaction for one post.
   *
   * Response shape (confirmed via Postman):
   *   { success, postId, counts: { APPRECIATE, HELPFUL, … }, myReaction }
   *
   * @param {string|number} postId
   * @returns {Promise<{ counts: object, myReaction: string|null }>}
   *          Resolves to empty defaults on any failure.
   */
  async getReactions(postId) {
    try {
      const data = await request(`/api/posts/${postId}/reactions`, { method: 'GET' });
      return {
        counts: data?.counts ?? {},
        myReaction: data?.myReaction ?? null,
      };
    } catch (err) {
      console.warn(`[homePostService] GET reactions for post ${postId}:`, err.message);
      return { counts: {}, myReaction: null };
    }
  },

  /**
   * PUT /api/posts/:postId/reactions/:reactionType
   * Adds or updates the current user's reaction.  Idempotent — safe to call
   * when the reaction is already set (server upserts).
   *
   * Supported reactionType values (confirmed via Postman): APPRECIATE, HELPFUL
   *
   * @param {string|number} postId
   * @param {'APPRECIATE'|'HELPFUL'} reactionType
   * @returns {Promise<object>}  Raw server response.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async addReaction(postId, reactionType) {
    return request(`/api/posts/${postId}/reactions/${reactionType}`, { method: 'PUT' });
  },

  /**
   * DELETE /api/posts/:postId/reactions/:reactionType
   * Removes the current user's reaction of the given type.
   *
   * @param {string|number} postId
   * @param {'APPRECIATE'|'HELPFUL'} reactionType
   * @returns {Promise<object>}  Raw server response.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async removeReaction(postId, reactionType) {
    return request(`/api/posts/${postId}/reactions/${reactionType}`, { method: 'DELETE' });
  },

  // ── Learned ───────────────────────────────────────────────────────────────
  /**
   * PUT /api/posts/:postId/learned
   * Marks the current user as having learned from this post.
   *
   * @param {string|number} postId
   * @returns {Promise<object>}  Raw server response.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async markLearned(postId) {
    return request(`/api/posts/${postId}/learned`, { method: 'PUT' });
  },

  /**
   * DELETE /api/posts/:postId/learned
   * Unmarks the current user's learned status for this post.
   *
   * @param {string|number} postId
   * @returns {Promise<object>}  Raw server response.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async unmarkLearned(postId) {
    return request(`/api/posts/${postId}/learned`, { method: 'DELETE' });
  },

  // ── Live Feed fetch (GET /api/posts/feed) — cursor-based pagination ─────────
  /**
   * Fetch a page of public feed posts from the verified feed endpoint.
   *
   * GET /api/posts/feed
   * Query: cursor=<postId>  (omit on first page)
   *
   * Backend response (confirmed via Postman):
   *   {
   *     data: [{ id, postKind, postType, publishedAt, status, visibility, userId,
   *              media: [{ id, mediaType, mediaUrl, thumbnailUrl, position }] }],
   *     pagination: { limit, hasMore, nextCursor }
   *   }
   *
   * @param {string|null} cursor  – Pass null/undefined for the first page;
   *                                pass pagination.nextCursor for subsequent pages.
   * @returns {Promise<{ posts: Array, pagination: { limit, hasMore, nextCursor } }>}
   *           Always resolves.  On any failure returns { posts: [], pagination: { hasMore: false } }.
   */
  async getFeedPosts(cursor = null) {
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", String(cursor));
      const qs = params.toString() ? `?${params.toString()}` : "";

      console.debug(`[homePostService] GET ${FEED_ENDPOINT}${qs}`);

      const result = await request(`${FEED_ENDPOINT}${qs}`, { method: "GET" });

      // Verified response shape: { data: [...], pagination: { limit, hasMore, nextCursor } }
      const posts = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.posts)
          ? result.posts
          : Array.isArray(result)
            ? result
            : [];

      const pagination = result?.pagination ?? { limit: 10, hasMore: false, nextCursor: null };

      console.debug(
        `[homePostService] Feed page fetched — ${posts.length} post(s),`,
        `hasMore: ${pagination.hasMore}, nextCursor: ${pagination.nextCursor}`
      );

      return { posts, pagination };
    } catch (err) {
      const status = err.status ?? 0;
      if (status === 401 || status === 403) {
        console.warn(
          `[homePostService] GET /api/posts/feed returned ${status} — auth error.`,
          err.message
        );
      } else if (status === 0) {
        console.warn(
          "[homePostService] GET /api/posts/feed — network/CORS failure.",
          err.message
        );
      } else {
        console.warn(
          `[homePostService] GET /api/posts/feed returned ${status}:`,
          err.message
        );
      }
      return { posts: [], pagination: { limit: 10, hasMore: false, nextCursor: null } };
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
  _normalisePost(payload, fallbackType = "image") {
    const p =
      payload?.data?.post ??
      payload?.post ??
      payload?.data ??
      payload ??
      {};

    const media = Array.isArray(p.media)
      ? p.media[0]
      : p.media ?? payload?.media ?? {};

    const rawType =
      media?.mediaType ??
      p.mediaType ??
      p.postType ??
      p.postKind ??
      fallbackType;

    const isVideo = String(rawType).toLowerCase().includes("video");

    const mediaSrc =
      media?.mediaUrl ??
      media?.url ??
      p.mediaUrl ??
      p.videoUrl ??
      p.imageUrl ??
      "";

    return {
      id: p.postId ?? p.id ?? p._id ?? `local-${Date.now()}`,
      type: isVideo ? "reel" : "post",
      caption: p.caption ?? "",
      tags: Array.isArray(p.tags) ? p.tags : [],
      category: p.category ?? "Discover",
      timestamp: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "Just now",
      creator: {
        name: p.creator?.name ?? p.user?.name ?? p.author?.name ?? "You",
        username: p.creator?.username ?? p.user?.username ?? "",
        field: p.creator?.field ?? p.user?.field ?? "Community Member",
        avatar: p.creator?.avatar ?? p.user?.avatar ?? "",
      },
      media: {
        type: isVideo ? "video" : mediaSrc ? "image" : "text",
        src: mediaSrc,
        ...(media?.thumbnailUrl
          ? { poster: media.thumbnailUrl }
          : {}),
      },
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

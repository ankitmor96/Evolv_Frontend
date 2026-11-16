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
import { forceLogout } from './sessionService.js';

// ─── Verified endpoint paths ──────────────────────────────────────────────────
/** POST /api/posts — image post (multipart field: "image") */
const IMAGE_POST_ENDPOINT = "/api/posts";

/** POST /api/posts/video — video/reel post (multipart field: "video") */
const VIDEO_POST_ENDPOINT = "/api/posts/video";

/** GET /api/posts — not yet implemented; returns 404 (kept for legacy getPosts()) */
const GET_ENDPOINT = "/api/posts";

// POST /api/posts/text — text / article / question / achievement (JSON body)
const TEXT_POST_ENDPOINT = "/api/posts/text";

const TEXT_KINDS = ["text", "article", "question", "achievement"];

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



const request = async (path, options = {}) => {
  const { silentStatuses = [], ...fetchOptions } = options;
  const startedAt = Date.now();
  const token = getToken();
  const isFormData = fetchOptions.body instanceof FormData;
  const controller = new AbortController();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(fetchOptions.headers ?? {}),
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

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    if (response.status === 401 && token) {
      forceLogout();
    }

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
    if (!silentStatuses.includes(error.status)) {
      console.error("[VIDEO DEBUG] Request failed", {
        message: error.message,
        name: error.name,
        elapsedMs: Date.now() - startedAt,
      });
    }
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

const SKILL_FIELDS = (p) => [
  p.skills, p.postSkills, p.post_skills, p.skillTags, p.tags,
];

const extractSkillNames = (p) =>
  SKILL_FIELDS(p)
    .filter(Array.isArray)
    .flat()
    .map((s) =>
      typeof s === 'string'
        ? s
        : s?.name ??
        s?.skillName ??
        s?.skill?.name ??
        s?.skill?.skillName ??
        null
    )
    .filter(Boolean);

const extractSkillIds = (p) => {
  const direct = Array.isArray(p.skillIds) ? p.skillIds : [];
  const nested = SKILL_FIELDS(p)
    .filter(Array.isArray)
    .flat()
    .map((s) =>
      typeof s === 'number'
        ? s
        : typeof s === 'object'
          ? s?.skillId ?? s?.skill?.id ?? s?.id ?? null
          : null
    );

  return [...new Set([...direct, ...nested].filter((id) => id != null).map(Number))];
};

const SKILL_CACHE_KEY = 'evolv-post-skills';

export const postSkillCache = {
  _read() {
    try { return JSON.parse(localStorage.getItem(SKILL_CACHE_KEY)) || {}; }
    catch { return {}; }
  },
  save(postId, names) {
    if (postId == null || !names?.length) return;
    const all = this._read();
    all[String(postId)] = names;
    try { localStorage.setItem(SKILL_CACHE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  },
  get(postId) {
    return this._read()[String(postId)] ?? [];
  },
};

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
    if (response.status === 401 && token) {
      forceLogout();
    }
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

  async createImagePost(caption, imageFile, skillIds = []) {
    if (!getToken()) {
      throw new Error("Please log in before creating a post.");
    }
    if (!imageFile) {
      throw new Error("Please select an image to upload.");
    }

    const formData = new FormData();
    formData.append("caption", caption ?? "");
    formData.append("image", imageFile);
    formData.append('skillIds', JSON.stringify(skillIds));

    console.debug("[homePostService] POST", IMAGE_POST_ENDPOINT, "— image post");

    const payload = await request(IMAGE_POST_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    return this._normalisePost(payload, "image");
  },

  // ── Video / reel post ────────────────────────────────────────────────────────
  /**
   * @param {string} caption   – Post caption.
   * @param {File}   videoFile – The selected video File.
   * @returns {Promise<object>} Normalised feed-post object ready for the feed.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async createVideoPost(caption, videoFile, skillIds = []) {
    if (!getToken()) {
      throw new Error("Please log in before creating a post.");
    }
    if (!videoFile) {
      throw new Error("Please select a video to upload.");
    }

    const formData = new FormData();
    formData.append("caption", caption ?? "");
    formData.append("video", videoFile);
    formData.append('skillIds', JSON.stringify(skillIds));

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

    const skillIds = Array.isArray(postData.skillIds) ? postData.skillIds : [];

    // ── Document ──
    if (postData.type === "document") {
      const file = postData.file;

      if (!(file instanceof File)) {
        throw new Error("Please select a valid document");
      }

      const formData = new FormData();
      formData.append("document", file);
      formData.append("caption", postData.caption || "");
      formData.append("skillIds", JSON.stringify(skillIds));

      return request("/api/posts/document", {
        method: "POST",
        body: formData,
      });
    }

    // ── Video / reel ──
    if (postData.type === "video" || postData.type === "reel") {
      return this.createVideoPost(postData.caption, postData.videoFile, skillIds);
    }

    // ── Image ──
    if (postData.type === "image") {
      return this.createImagePost(postData.caption, postData.imageFile, skillIds);
    }

    // ── Text-based: text / article / question / achievement ──
    if (TEXT_KINDS.includes(postData.type)) {
      const body = {
        postType: postData.type.toUpperCase(),
        caption: postData.caption || "",
        title: postData.title || "",
        subtitle: postData.subtitle || "",
        content: postData.content || "",
        description: postData.description || "",
        skillIds,
      };

      const payload = await request(TEXT_POST_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const post = this._normalisePost(payload, postData.type);

      return {
        ...post,
        kind: postData.type,
        title: post.title || body.title,
        subtitle: post.subtitle || body.subtitle,
        content: post.content || body.content,
        description: post.description || body.description,
      };
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
    try {
      return await request(`/api/posts/${postId}/reactions/${reactionType}`, {
        method: 'DELETE',
        silentStatuses: [404],
      });
    } catch (err) {
      if (err.status === 404) return { success: true, alreadyRemoved: true };
      throw err;
    }
  },

  /**
  * DELETE /api/posts/:postId/learned
  * @param {string|number} postId
  * @returns {Promise<object>}  Raw server response.
  * @throws {Error} On auth failure, network error, or server error.
  */

  async unmarkLearned(postId) {
    try {
      return await request(`/api/posts/${postId}/learned`, {
        method: 'DELETE',
        silentStatuses: [404],
      });
    } catch (err) {
      if (err.status === 404) return { success: true, alreadyRemoved: true };
      throw err;
    }
  },

  // ── Learned ───────────────────────────────────────────────────────────────
  /**
   * PUT /api/posts/:postId/learned
   * @param {string|number} postId
   * @returns {Promise<object>}  Raw server response.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async markLearned(postId) {
    return request(`/api/posts/${postId}/learned`, { method: 'PUT' });
  },



  // ── Comments ──────────────────────────────────────────────────────────────

  /**
   * GET /api/posts/:postId/comments
   * @param {string|number} postId
   * @returns {Promise<Array>} Comments array, or [] on failure.
   */
  async getComments(postId) {
    try {
      const result = await request(`/api/posts/${postId}/comments`, { method: 'GET' });
      // Backend may return array directly or wrapped in { data }
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
    } catch (err) {
      console.warn(`[homePostService] GET comments for post ${postId}:`, err.message);
      return [];
    }
  },

  /**
   * POST /api/posts/:postId/comments
   * @param {string|number} postId
   * @param {string} content
   * @returns {Promise<object>} Created comment object.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async createComment(postId, content) {
    return request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * PATCH /api/comments/:commentId
   * @param {string|number} commentId
   * @param {string} content  – New comment content.
   * @returns {Promise<object>} Updated comment response.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async updateComment(commentId, content) {
    return request(`/api/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * DELETE /api/comments/:commentId
   * @param {string|number} commentId
   * @returns {Promise<object>} Deletion confirmation.
   * @throws {Error} On auth failure, network error, or server error.
   */
  async deleteComment(commentId) {
    return request(`/api/comments/${commentId}`, { method: 'DELETE' });
  },

  /**
   * GET /api/posts/:postId/comments/count
   * @param {string|number} postId
   * @returns {Promise<number>} Comment count, or 0 on failure.
   */
  async getCommentCount(postId) {
    try {
      const result = await request(`/api/posts/${postId}/comments/count`, { method: 'GET' });
      return typeof result?.count === 'number' ? result.count : 0;
    } catch (err) {
      console.warn(`[homePostService] GET comment count for post ${postId}:`, err.message);
      return 0;
    }
  },
    // ── Your Growth: learning skill stats ─────────────────────────────────────
  /**
   * GET /api/posts/learning/skill-stats
   * Response: { success, totalSkills, data: [{ skillId, skillName,
   *   exploredPostCount, reactionRanking: { APPRECIATE, HELPFUL, LEARNED } }] }
   */
  async getLearningSkillStats() {
    const result = await request('/api/posts/learning/skill-stats', { method: 'GET' });

    const list = Array.isArray(result?.data) ? result.data : [];

    const skills = list
      .map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName ?? '',
        exploredPostCount: Number(s.exploredPostCount ?? 0),
        appreciate: Number(s.reactionRanking?.APPRECIATE ?? 0),
        helpful: Number(s.reactionRanking?.HELPFUL ?? 0),
        learned: Number(s.reactionRanking?.LEARNED ?? 0),
      }))
      .filter((s) => s.skillName)
      .sort((a, b) => b.exploredPostCount - a.exploredPostCount);

    return {
      totalSkills: Number(result?.totalSkills ?? skills.length),
      skills,
    };
  },
  /**
   * Uses GET /api/posts/:id/comments/count (one call per post, in parallel).
   */
  async attachCommentCounts(posts) {
    return Promise.all(
      posts.map(async (p) => {
        // Skip if the feed already gave us a count
        if (p.comments > 0) return p;
        const count = await this.getCommentCount(p.id);
        return { ...p, comments: count };
      })
    );
  },
  /**
   * GET /api/comments/my-comments
   * @returns {Promise<Array>} User's comments array, or [] on failure.
   */
  async getMyComments() {
    try {
      const result = await request('/api/comments/my-comments', { method: 'GET' });
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
    } catch (err) {
      console.warn('[homePostService] GET my-comments:', err.message);
      return [];
    }
  },

  // ── My Posts (for Profile Page) ─────────────────────────────────────────

  /**
   * Fetch the current user's own posts from the feed by matching userId.
   * Uses GET /api/posts/feed and filters by the authenticated user's ID.
   * Falls back to GET /api/posts/my-posts/* for image/video/document counts.
   *
   * @param {string|number} currentUserId  - The authenticated user's ID (from authService).
   * @returns {Promise<Array>} Normalized post objects belonging to the current user.
   */


  async getMyPosts(currentUserId) {
    const endpoints = [
      { path: "/api/posts/my-posts/images", type: "image" },
      { path: "/api/posts/my-posts/videos", type: "video" },
      { path: "/api/posts/my-posts/documents", type: "document" },
    ];

    const results = await Promise.all(
      endpoints.map(async ({ path, type }) => {
        try {
          const result = await request(path, {
            method: "GET",
          });

          const rawPosts = Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.posts)
              ? result.posts
              : Array.isArray(result?.data?.posts)
                ? result.data.posts
                : Array.isArray(result)
                  ? result
                  : [];

          return rawPosts.map((post) => ({
            ...this._normalisePost(post, type),
            _sortDate:
              post.publishedAt ||
              post.createdAt ||
              post.updatedAt ||
              "",
          }));
        } catch (err) {
          console.error(
            `[homePostService] Failed to load ${type} posts:`,
            err.message
          );

          return [];
        }
      })
    );

    const uniquePosts = new Map();

    results.flat().forEach((post) => {
      if (post.id != null) {
        const { _sortDate, ...normalizedPost } = post;

        uniquePosts.set(String(post.id), {
          ...normalizedPost,
          _sortDate,
        });
      }
    });

    return Array.from(uniquePosts.values())
      .sort(
        (a, b) =>
          new Date(b._sortDate || 0).getTime() -
          new Date(a._sortDate || 0).getTime()
      )
      .map(({ _sortDate, ...post }) => post);
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

  // ── Personalised feed (INITIAL / EXPANDED) ─────────────────────────────────
  /**
   * GET /api/posts/feed?cursor=...
   * Throws on failure so the UI can show an error state.
   */
  async getPersonalizedFeed(cursor = null) {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", String(cursor));
    const qs = params.toString() ? `?${params.toString()}` : "";

    const result = await request(`${FEED_ENDPOINT}${qs}`, { method: "GET" });
    console.log('[Feed raw response]', result);

    const posts = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.posts)
        ? result.posts
        : Array.isArray(result)
          ? result
          : [];

    const pg = result?.pagination ?? {};

    return {
      posts,
      feedMode: result?.feedMode ?? null,               // "INITIAL" | "EXPANDED"
      highlightedSkill: result?.highlightedSkill ?? null,
      skillDistribution: Array.isArray(result?.skillDistribution)
        ? result.skillDistribution
        : [],
      pagination: {
        limit: pg.limit ?? 10,
        // never say "has more" without a cursor, otherwise infinite loop
        hasMore: Boolean(pg.hasMore && pg.nextCursor),
        nextCursor: pg.nextCursor ?? null,
      },
    };
  },

  // ── Delete Post ───────────────────────────────────────────────────────────
  /**
   * Delete a post owned by the logged-in user.
   * DELETE /api/posts/:postId
   * @param {string|number} postId  – The backend post ID.
   * @returns {Promise<object>}     – Backend response on success.
   * @throws {Error}                – On auth failure, not-found, or server error.
   */
  async deletePost(postId) {
    return request(`/api/posts/${postId}`, { method: 'DELETE' });
  },

  // ── Internal: response → feed-post normaliser ─────────────────────────────
  /**
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

    const rawType = String(
      media?.mediaType ??
      p.mediaType ??
      p.postType ??
      p.postKind ??
      fallbackType
    ).toLowerCase();

    const postTypeStr = String(p.postType ?? p.postKind ?? "").toLowerCase();
    const urlForCheck = String(
      media?.documentUrl ?? media?.fileUrl ?? media?.mediaUrl ?? media?.url ??
      p.documentUrl ?? p.fileUrl ?? p.mediaUrl ?? ""
    ).toLowerCase().split("?")[0];

    const DOC_EXT = /\.(pdf|docx?|pptx?|xlsx?|txt|csv)$/;

    const isVideo = rawType.includes("video");
    const isDocument =
      !isVideo &&
      (
        [rawType, postTypeStr].some(
          (t) =>
            t.includes("document") ||
            t.includes("file") ||
            t.includes("raw") ||
            t.includes("application/")
        ) ||
        DOC_EXT.test(urlForCheck) ||
        urlForCheck.includes("/raw/upload/")
      );

    const mediaSrc =
      media?.mediaUrl ??
      media?.url ??
      p.mediaUrl ??
      p.videoUrl ??
      p.imageUrl ??
      "";
    const declaredKind = String(
      p.postType ?? p.postKind ?? p.type ?? ""
    ).toLowerCase();

    const kind = TEXT_KINDS.includes(declaredKind)
      ? declaredKind
      : TEXT_KINDS.includes(fallbackType)
        ? fallbackType
        : "media";

    return {
      id: p.postId ?? p.id ?? p._id ?? `local-${Date.now()}`,
      type: isVideo ? "reel" : "post",
      caption: p.caption ?? "",
      kind,
      title: p.title ?? "",
      subtitle: p.subtitle ?? p.subTitle ?? "",
      content: p.content ?? p.body ?? p.text ?? "",
      description: p.description ?? "",
      tags: extractSkillNames(p),
      skillIds: extractSkillIds(p),
      category: p.category ?? "Discover",
      timestamp: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "Just now",
      creator: {
        id:
          p?.creator?.id ??
          p?.creator?.userId ??
          p?.creator?.user?.id ??
          p?.user?.id ??
          p?.userId ??
          p?.author?.id ??
          p?.authorId ??
          p?.user_id ??
          null,

        name:
          p.creator?.name ??
          p.creator?.fullName ??
          p.creator?.displayName ??
          p.user?.name ??
          p.user?.fullName ??
          p.user?.displayName ??
          p.author?.name ??
          p.author?.fullName ??
          p.author?.displayName ??
          (p.creator?.firstName ? `${p.creator.firstName} ${p.creator.lastName || ''}`.trim() : null) ??
          (p.user?.firstName ? `${p.user.firstName} ${p.user.lastName || ''}`.trim() : null) ??
          (p.author?.firstName ? `${p.author.firstName} ${p.author.lastName || ''}`.trim() : null) ??
          (typeof p.creator === 'string' ? p.creator : null) ??
          (typeof p.author === 'string' ? p.author : null) ??
          p.creator?.username ??
          p.user?.username ??
          p.author?.username ??
          p.username ??
          "",

        username:
          p.creator?.username ??
          p.user?.username ??
          p.author?.username ??
          p.creator?.email?.split('@')[0] ??
          p.user?.email?.split('@')[0] ??
          p.author?.email?.split('@')[0] ??
          p.username ??
          "",

        field:
          p.creator?.field ??
          p.user?.field ??
          p.author?.field ??
          "Community Member",

        avatar:
          p.creator?.avatar ??
          p.creator?.avatarUrl ??
          p.creator?.profileImage ??
          p.creator?.profilePhoto ??
          p.user?.avatar ??
          p.user?.avatarUrl ??
          p.user?.profileImage ??
          p.user?.profilePhoto ??
          p.author?.avatar ??
          p.author?.avatarUrl ??
          p.author?.profileImage ??
          p.author?.profilePhoto ??
          "",
      },
      media: {
        type: isDocument
          ? "document"
          : isVideo
            ? "video"
            : mediaSrc
              ? "image"
              : "text",

        src:
          media?.documentUrl ??
          media?.fileUrl ??
          media?.mediaUrl ??
          media?.url ??
          p.documentUrl ??
          p.fileUrl ??
          p.mediaUrl ??
          p.imageUrl ??
          "",

        fileName:
          media?.metadata?.originalName ??
          media?.fileName ??
          media?.originalName ??
          media?.altText ??
          p.fileName ??
          p.originalName ??
          p.document?.name ??
          (DOC_EXT.test(String(p.caption ?? "").toLowerCase()) ? p.caption : null) ??
          (urlForCheck ? decodeURIComponent(urlForCheck.split("/").pop()) : null) ??
          "Document",

        ...(media?.thumbnailUrl
          ? { poster: media.thumbnailUrl }
          : {}),
      },
      liked: Boolean(p.liked || p.isLiked || p.myReaction === 'APPRECIATE' || p.appreciated),
      saved: Boolean(p.saved || p.isSaved || p.bookmarked),
      followed: Boolean(p.followed || p.isFollowed),
      appreciated: Boolean(p.appreciated || p.myReaction === 'APPRECIATE' || p.liked),
      appreciations: Number(
        p.appreciations ??
        p.appreciationCount ??
        p.reactionCounts?.APPRECIATE ??
        p.reactions?.counts?.APPRECIATE ??
        p.reactions?.APPRECIATE ??
        p.reactions?.appreciate ??
        p.likes ??
        p.likeCount ??
        0
      ),
      helpful: Boolean(p.helpful || p.isHelpful || p.myReaction === 'HELPFUL'),
      helpfulCount: Number(
        p.helpfulCount ??
        p.reactionCounts?.HELPFUL ??
        p.reactions?.counts?.HELPFUL ??
        p.reactions?.HELPFUL ??
        p.reactions?.helpful ??
        0
      ),
      learned: Boolean(p.learned === true || p.isLearned || p.hasLearned),
      learnedCount: Number(
        p.learnedCount ??
        p.learnings ??
        p.learnCount ??
        (typeof p.learned === 'number' ? p.learned : 0)
      ),
      comments: Number(
        p.commentCount ??
        p.commentsCount ??
        p.comments_count ??
        p._count?.comments ??
        (Array.isArray(p.comments) ? p.comments.length : p.comments) ??
        0
      ),
      likes: Number(
        p.likes ??
        p.likeCount ??
        p.appreciations ??
        p.reactionCounts?.APPRECIATE ??
        0
      ),
    };
  },
};

/**
 * EVOLV Profile Service
 *
 * Handles all Profile / Onboarding backend API communication.
 *
 * Endpoint base: VITE_API_BASE_URL (same env var used by authService.js).
 * Token:         "evolv_auth_token" from localStorage or sessionStorage.
 *
 * Endpoints (exact, from Postman collection):
 *
 *   UserProfile-1page
 *     GET    /api/profile
 *     PATCH  /api/profile          body: { username, ageRange, identityTypeIds[], primaryIdentityTypeId }
 *     DELETE /api/profile
 *     GET    /api/profile/complete
 *
 *   UserBio-4page
 *     GET    /api/profile/bio
 *     POST   /api/profile/bio      body: { bio }
 *     PATCH  /api/profile/bio      body: { bio }
 *
 *   UserIdentity
 *     GET    /api/identity-types
 *     GET    /api/user-identities
 *     POST   /api/user-identities/select    body: { identityTypeIds[], primaryIdentityTypeId }
 *     PATCH  /api/user-identities/:id       body: { isPrimary }
 *     DELETE /api/user-identities/:id
 *
 *   SkillCategory-2page
 *     GET    /api/skills/categories/:id/skills
 *     GET    /api/skills/curiosity
 *     POST   /api/skills/curiosity           body: { skillIds[] }
 *     PATCH  /api/skills/curiosity           body: { skillIds[] }
 *     DELETE /api/skills/curiosity/:skillId
 *
 *   UserSkills
 *     GET    /api/skills/user-skills
 *     POST   /api/skills/user-skills         body: { skill[], relationshipType }
 *     PATCH  /api/skills/user-skills/:id     body: { skill[], relationshipType }
 *     DELETE /api/skills/user-skills/:id
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

/** Token key matches authService.js exactly. */
const TOKEN_KEY = "evolv_auth_token";

/** Read the stored token from whichever storage it was saved in (mirrors authService). */
const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;

/**
 * Reusable fetch wrapper for all profile API calls.
 *
 * - Automatically adds Authorization: Bearer <token> for protected routes.
 * - Serialises body objects to JSON.
 * - Throws an Error with { message, status, payload } on non-2xx responses.
 *
 * @param {string} path      – e.g. "/api/profile"
 * @param {RequestInit} options – fetch init overrides (method, body, headers…)
 * @returns {Promise<any>}   – parsed JSON response body
 */
const request = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const init = {
    ...options,
    headers,
    // Serialise body if it is a plain object
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  };

  console.debug(`[profileService] ${init.method ?? "GET"} ${url}`);

  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));

  console.debug(`[profileService] ${response.status} ←`, payload);

  if (!response.ok) {
    const { message } = payload ?? {};
    const msg = Array.isArray(message)
      ? message.join(" ")
      : typeof message === "string" && message.trim()
      ? message
      : payload?.error ?? `Request failed with status ${response.status}.`;

    const err = new Error(msg);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
};

// ─── In-memory skill name → backend ID cache ──────────────────────────────────
// Built once per session by fetchSkillNameToIdMap().
let _skillNameToIdCache = null;

// ─── Public service object ────────────────────────────────────────────────────

export const profileService = {

  // ═══════════════════════════════════════════════
  // USER PROFILE
  // ═══════════════════════════════════════════════

  /** GET /api/profile */
  getProfile() {
    return request("/api/profile");
  },

  /**
   * PATCH /api/profile
   * body: { username, ageRange, identityTypeIds, primaryIdentityTypeId }
   */
  updateProfile(data) {
    return request("/api/profile", { method: "PATCH", body: data });
  },

  /** DELETE /api/profile */
  deleteProfile() {
    return request("/api/profile", { method: "DELETE" });
  },

  // ═══════════════════════════════════════════════
  // COMPLETE PROFILE
  // ═══════════════════════════════════════════════

  /** GET /api/profile/complete */
  getCompleteProfile() {
    return request("/api/profile/complete");
  },

  // ═══════════════════════════════════════════════
  // BIO
  // ═══════════════════════════════════════════════

  /** GET /api/profile/bio */
  getBio() {
    return request("/api/profile/bio");
  },

  /**
   * POST /api/profile/bio – creates the bio record for the first time.
   * body: { bio }
   */
  createBio(bio) {
    return request("/api/profile/bio", { method: "POST", body: { bio } });
  },

  /**
   * PATCH /api/profile/bio – updates an existing bio record.
   * body: { bio }
   */
  updateBio(bio) {
    return request("/api/profile/bio", { method: "PATCH", body: { bio } });
  },

  /**
   * Upsert helper: tries PATCH first (update).
   * Falls back to POST (create) when the backend returns 404 or 400 because
   * the bio record does not yet exist for this user.
   */
  async saveBio(bio) {
    try {
      return await profileService.updateBio(bio);
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        return profileService.createBio(bio);
      }
      throw err;
    }
  },

  // ═══════════════════════════════════════════════
  // IDENTITY TYPES
  // ═══════════════════════════════════════════════

  /** GET /api/identity-types – all available identity type options */
  getIdentityTypes() {
    return request("/api/identity-types");
  },

  /** GET /api/user-identities – the current user's selected identities */
  getUserIdentities() {
    return request("/api/user-identities");
  },

  /**
   * POST /api/user-identities/select
   * body: { identityTypeIds: number[], primaryIdentityTypeId: number }
   */
  selectUserIdentities(identityTypeIds, primaryIdentityTypeId) {
    return request("/api/user-identities/select", {
      method: "POST",
      body: { identityTypeIds, primaryIdentityTypeId },
    });
  },

  /**
   * PATCH /api/user-identities/:id
   * body: { isPrimary: boolean }
   */
  updateIdentity(id, isPrimary) {
    return request(`/api/user-identities/${id}`, {
      method: "PATCH",
      body: { isPrimary },
    });
  },

  /** DELETE /api/user-identities/:id */
  deleteIdentity(id) {
    return request(`/api/user-identities/${id}`, { method: "DELETE" });
  },

  // ═══════════════════════════════════════════════
  // SKILL CATEGORIES
  // ═══════════════════════════════════════════════

  /** GET /api/skills/categories/:id/skills */
  getCategorySkills(categoryId) {
    return request(`/api/skills/categories/${categoryId}/skills`);
  },

  // ═══════════════════════════════════════════════
  // CURIOSITY SKILLS
  // ═══════════════════════════════════════════════

  /** GET /api/skills/curiosity */
  getUserCuriosity() {
    return request("/api/skills/curiosity");
  },

  /**
   * POST /api/skills/curiosity
   * body: { skillIds: number[] }
   */
  createUserCuriosity(skillIds) {
    return request("/api/skills/curiosity", {
      method: "POST",
      body: { skillIds },
    });
  },

  /**
   * PATCH /api/skills/curiosity
   * body: { skillIds: number[] }
   */
  updateUserCuriosity(skillIds) {
    return request("/api/skills/curiosity", {
      method: "PATCH",
      body: { skillIds },
    });
  },

  /**
   * DELETE /api/skills/curiosity/:skillId
   * Deletes a single curiosity entry by its skill ID.
   */
  deleteUserCuriosity(skillId) {
    return request(`/api/skills/curiosity/${skillId}`, { method: "DELETE" });
  },

  // ═══════════════════════════════════════════════
  // USER SKILLS
  // ═══════════════════════════════════════════════

  /** GET /api/skills/user-skills */
  getUserSkills() {
    return request("/api/skills/user-skills");
  },

  /**
   * POST /api/skills/user-skills
   * body: { skill: number[], relationshipType: "CAN_DO" | "LEARNING" | "WANT_TO_IMPROVE" }
   *
   * Note: the backend field name is "skill" (not "skillIds") — exact from Postman.
   */
  addUserSkill(skillIds, relationshipType) {
    return request("/api/skills/user-skills", {
      method: "POST",
      body: { skill: skillIds, relationshipType },
    });
  },

  /**
   * PATCH /api/skills/user-skills/:id
   * body: { skill: number[], relationshipType: string }
   */
  updateUserSkill(id, skillIds, relationshipType) {
    return request(`/api/skills/user-skills/${id}`, {
      method: "PATCH",
      body: { skill: skillIds, relationshipType },
    });
  },

  /** DELETE /api/skills/user-skills/:id */
  deleteUserSkill(id) {
    return request(`/api/skills/user-skills/${id}`, { method: "DELETE" });
  },

  // ═══════════════════════════════════════════════
  // NAME → ID MAPPING HELPERS
  // ═══════════════════════════════════════════════

  /**
   * Builds a { "skill name (lower-cased)": backendId } map by fetching skills
   * for category IDs 1–20 in parallel.
   *
   * Results are cached in memory so subsequent calls cost nothing.
   * Non-existent category IDs are silently ignored (the backend returns 404).
   *
   * @returns {Promise<Record<string, number>>}
   */
  async fetchSkillNameToIdMap() {
    if (_skillNameToIdCache) return _skillNameToIdCache;

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) =>
        profileService.getCategorySkills(i + 1)
      )
    );

    const map = {};
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const data = result.value;
      // Backend may return the skill list directly or under a data/skills key
      const skills = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.skills)
        ? data.skills
        : [];

      for (const skill of skills) {
        if (skill?.name && skill?.id != null) {
          map[skill.name.toLowerCase().trim()] = Number(skill.id);
        }
      }
    }

    _skillNameToIdCache = map;
    console.debug(
      `[profileService] Skill name→ID map built: ${Object.keys(map).length} entries`
    );
    return map;
  },

  /**
   * Convert an array of skill name strings to backend integer IDs.
   * Names that have no matching ID in the map are silently dropped.
   *
   * @param {string[]} names
   * @param {Record<string, number>} map   – from fetchSkillNameToIdMap()
   * @returns {number[]}
   */
  mapNamesToIds(names, map) {
    const ids = [];
    for (const name of names) {
      const id = map[name.toLowerCase().trim()];
      if (id != null) ids.push(id);
    }
    return ids;
  },

  /**
   * Map a frontend role label (e.g. "Student") to a backend identity type ID.
   *
   * @param {string}   roleName      – exact or case-insensitive match
   * @param {object[]} identityTypes – response from getIdentityTypes()
   * @returns {number|null}
   */
  mapRoleToIdentityTypeId(roleName, identityTypes) {
    const list = Array.isArray(identityTypes)
      ? identityTypes
      : (identityTypes?.data ?? []);

    const match = list.find(
      (t) =>
        (t.name ?? t.label ?? t.type ?? "")
          .toLowerCase()
          .trim() === roleName.toLowerCase().trim()
    );
    return match?.id ?? null;
  },

  // ═══════════════════════════════════════════════
  // ONBOARDING SUBMISSION
  // ═══════════════════════════════════════════════

  /**
   * Submit the complete onboarding draft to the backend.
   *
   * Flow:
   *   1. Fetch skill name→ID map (cached after first call)
   *   2. Fetch identity types to resolve role → ID
   *   3. PATCH /api/profile         (username + ageRange + identity)
   *   4. POST  /api/skills/curiosity (curiosity skill IDs)
   *   5. POST  /api/skills/user-skills for canDo  (CAN_DO)
   *   6. POST  /api/skills/user-skills for learning (LEARNING)
   *   7. POST  /api/skills/user-skills for wantToImprove (WANT_TO_IMPROVE)
   *   8. POST/PATCH /api/profile/bio
   *
   * Each section is submitted independently. A failure in one section is
   * logged to the console but does not block the remaining submissions,
   * so the user is never left stranded on the completion screen.
   *
   * @param {object} draft  – the full onboarding draft object
   * @returns {Promise<{ errors: string[] }>}  – list of section keys that failed
   */
  async submitOnboardingDraft(draft) {
    const errors = [];

    // ── 1. Skill name→ID map ─────────────────────────────────────────────
    let skillMap = {};
    try {
      skillMap = await profileService.fetchSkillNameToIdMap();
    } catch (err) {
      console.error("[profileService] Failed to build skill map:", err);
      errors.push("skill-map");
    }

    // ── 2. Identity types (role → ID) ────────────────────────────────────
    let identityTypes = [];
    try {
      const res = await profileService.getIdentityTypes();
      identityTypes = Array.isArray(res) ? res : (res?.data ?? []);
    } catch (err) {
      console.error("[profileService] Failed to fetch identity types:", err);
      errors.push("identity-types");
    }

    // ── 3. PATCH /api/profile ────────────────────────────────────────────
    const roleName =
      draft.role === "Other"
        ? (draft.customRole ?? "").trim()
        : (draft.role ?? "").trim();

    const identityTypeId = roleName
      ? profileService.mapRoleToIdentityTypeId(roleName, identityTypes)
      : null;

    if (draft.username?.trim()) {
      const profileBody = {
        username: draft.username.trim(),
        ...(draft.ageRange ? { ageRange: draft.ageRange } : {}),
        ...(identityTypeId != null
          ? {
              identityTypeIds: [identityTypeId],
              primaryIdentityTypeId: identityTypeId,
            }
          : {}),
      };

      try {
        await profileService.updateProfile(profileBody);
        console.debug("[profileService] ✓ Profile updated");
      } catch (err) {
        console.error("[profileService] PATCH /api/profile failed:", err);
        errors.push("profile");
      }
    }

    // ── 4. Curiosity skills ──────────────────────────────────────────────
    const curiosityIds = profileService.mapNamesToIds(
      draft.curiosities ?? [],
      skillMap
    );

    if (curiosityIds.length > 0) {
      try {
        await profileService.createUserCuriosity(curiosityIds);
        console.debug("[profileService] ✓ Curiosity skills submitted");
      } catch (err) {
        // If curiosity record already exists try PATCH instead
        if (err.status === 409 || err.status === 400) {
          try {
            await profileService.updateUserCuriosity(curiosityIds);
            console.debug("[profileService] ✓ Curiosity skills updated (PATCH)");
          } catch (patchErr) {
            console.error("[profileService] Save curiosity failed:", patchErr);
            errors.push("curiosity");
          }
        } else {
          console.error("[profileService] POST /api/skills/curiosity failed:", err);
          errors.push("curiosity");
        }
      }
    }

    // ── 5–7. User skills (canDo / learning / wantToImprove) ──────────────
    const skillSections = [
      { key: "canDo",         relationshipType: "CAN_DO" },
      { key: "learning",      relationshipType: "LEARNING" },
      { key: "wantToImprove", relationshipType: "WANT_TO_IMPROVE" },
    ];

    for (const { key, relationshipType } of skillSections) {
      const ids = profileService.mapNamesToIds(
        draft.skills?.[key] ?? [],
        skillMap
      );
      if (ids.length === 0) continue;

      try {
        await profileService.addUserSkill(ids, relationshipType);
        console.debug(`[profileService] ✓ User skills submitted (${relationshipType})`);
      } catch (err) {
        console.error(
          `[profileService] POST /api/skills/user-skills (${relationshipType}) failed:`,
          err
        );
        errors.push(`user-skills-${relationshipType}`);
      }
    }

    // ── 8. Bio ────────────────────────────────────────────────────────────
    const bioText = (draft.bio ?? draft.focusGoal ?? "").trim();
    if (bioText) {
      try {
        await profileService.saveBio(bioText);
        console.debug("[profileService] ✓ Bio saved");
      } catch (err) {
        console.error("[profileService] Save bio failed:", err);
        errors.push("bio");
      }
    }

    if (errors.length > 0) {
      console.warn("[profileService] Submission completed with errors:", errors);
    } else {
      console.debug("[profileService] ✓ All profile sections submitted successfully");
    }

    return { errors };
  },
};

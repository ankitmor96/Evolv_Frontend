/**
 * EVOLV Profile Service
 *
 * Handles all Profile / Onboarding backend API communication.
 *
 * Endpoint base: VITE_API_BASE_URL (same env var used by authService.js).
 * Token:         "evolv_auth_token" from localStorage or sessionStorage.
 *
 * Endpoints (exact, verified against live backend):
 *
 *   UserProfile-1page
 *     GET    /api/profile
 *     POST   /api/profile          body: { username, ageRange, identityTypeIds[], primaryIdentityTypeId }  ← creates
 *     PATCH  /api/profile          body: { username, ageRange, identityTypeIds[], primaryIdentityTypeId }  ← updates
 *     DELETE /api/profile
 *     GET    /api/profile/complete
 *     POST   /api/profile/avatar   multipart/form-data, field: "avatar", returns { avatarUrl }  ← upload avatar
 *
 *   UserBio-4page
 *     GET    /api/profile/bio
 *     POST   /api/profile/bio      body: { bio }   ← creates (requires profile to exist first)
 *     PATCH  /api/profile/bio      body: { bio }   ← updates existing bio record
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
 *
 * Key backend contract (verified):
 *   - POST /api/profile creates the profile record for a new user.
 *   - PATCH /api/profile updates an existing record; returns 404 if no record exists.
 *   - POST /api/profile/bio requires the parent profile to exist; it returns
 *     404 "User profile not found" if the profile has not been created yet.
 *   - PATCH /api/profile/bio updates an existing bio; returns 404 if bio row absent.
 *   - Correct submission order: create/confirm profile → save bio → save skills.
 */

import { getCountryCode } from "../components/onboarding/onboardingData.js";

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
   * POST /api/profile – creates the profile record for a brand-new user.
   * body: { username, ageRange, identityTypeIds, primaryIdentityTypeId }
   *
   * Verified: route exists on backend (returns 401 when unauthenticated,
   * not 404), so it is safe to call for first-time profile creation.
   */
  // createProfile(data) {
  //   return request("/api/profile", { method: "POST", body: data });
  // },

async createProfile(data, file) {
  const url = `${API_BASE_URL}/api/profile`;
  const token = getToken();

  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    formData.append(
      key,
      Array.isArray(value) ? JSON.stringify(value) : String(value)
    );
  });

  // Backend requires the avatar during initial profile creation.
  if (file instanceof File) {
    formData.append("file", file);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.message || "Profile creation failed."
    );
  }

  return payload;
},

  /**
   * PATCH /api/profile – updates an existing profile record.
   * body: { username, ageRange, identityTypeIds, primaryIdentityTypeId }
   *
   * Returns 404 "User profile not found" when no record exists yet — in that
   * case callers should use createProfile() instead.
   */
  updateProfile(data) {
    return request("/api/profile", { method: "PATCH", body: data });
  },

  /**
   * Upsert helper: GET to check existence, then POST (create) or PATCH (update).
   *
   * The backend returns 404 from PATCH /api/profile when no record exists, so
   * we probe GET first to choose the right method. This avoids mistaking an
   * "update-on-missing" 404 for a successful no-op.
   *
   * @param {object} data – profile payload
   * @returns {Promise<any>}
   */
 async ensureProfile(data, file) {
  let profileExists = false;

  // 1. Check whether the profile already exists.
  try {
    await profileService.getProfile();
    profileExists = true;
  } catch (err) {
    // Only create a profile when the backend confirms it doesn't exist.
    if (err.status !== 404) {
      throw err;
    }
  }

  // 2. Update an existing profile.
  if (profileExists) {
    console.debug(
      "[profileService] Profile exists — updating with PATCH"
    );

    return await profileService.updateProfile(data);
  }

  // 3. Create a new profile with its required avatar.
  if (!(file instanceof File)) {
    throw new Error(
      "Avatar image is required. Please select a profile photo."
    );
  }

  console.debug(
    "[profileService] Profile does not exist — creating with POST"
  );

  return await profileService.createProfile(data, file);
},

  /** DELETE /api/profile */
  deleteProfile() {
    return request("/api/profile", { method: "DELETE" });
  },

  /**
   * POST /api/profile/avatar – uploads a profile photo to Cloudinary via the backend.
   *
   * IMPORTANT: Do NOT set Content-Type manually — the browser must set it so that
   * the multipart boundary is included correctly.
   *
   * @param {File} file – the image File selected by the user
   * @returns {Promise<any>} – parsed response; contains { avatarUrl } on success
   */
  async uploadAvatar(file) {
    const url = `${API_BASE_URL}/api/profile/avatar`;
    const token = getToken();

    const formData = new FormData();
    formData.append("file", file);

    console.debug(`[profileService] POST ${url} (multipart avatar upload)`);

    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // DO NOT set Content-Type here — the browser sets multipart/form-data
      // with the correct boundary automatically when body is FormData.
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    console.debug(`[profileService] avatar upload ${response.status} ←`, payload);

    if (!response.ok) {
      const msg =
        (Array.isArray(payload?.message)
          ? payload.message.join(" ")
          : payload?.message) ??
        payload?.error ??
        `Avatar upload failed with status ${response.status}.`;
      const err = new Error(msg);
      err.status = response.status;
      err.payload = payload;
      throw err;
    }

    return payload;
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
   * Requires the parent profile to already exist.
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
   * Upsert helper for bio.
   *
   * Strategy: POST first (create). If the backend responds 409 (bio row already
   * exists) or 400 (duplicate constraint), fall back to PATCH (update).
   *
   * We deliberately do NOT use PATCH-first here. The previous PATCH-first
   * approach failed because the backend returns a 404 "User profile not found"
   * when the parent profile is absent — which is a different 404 from
   * "bio row not found". The correct fix is to ensure the profile exists
   * before calling saveBio (handled in submitOnboardingDraft), then POST
   * to create the bio row.
   *
   * If both POST and PATCH fail, the original error is re-thrown so the
   * caller can record and surface it rather than silently discarding it.
   *
   * @param {string} bio
   * @returns {Promise<any>}
   */
  async saveBio(bio) {
    try {
      return await profileService.createBio(bio);
    } catch (createErr) {
      // 409 = bio row already exists; 400 may indicate the same depending on
      // the backend validation layer. Fall back to PATCH in those cases only.
      if (createErr.status === 409 || createErr.status === 400) {
        console.debug("[profileService] Bio already exists — falling back to PATCH");
        return profileService.updateBio(bio);
      }
      // Any other error (including 404 "profile not found") is a real failure.
      // Re-throw with context so submitOnboardingDraft records the section.
      console.error(
        `[profileService] POST /api/profile/bio failed (status ${createErr.status}):`,
        createErr.message,
        createErr.payload
      );
      throw createErr;
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
   * Fixed execution order (root cause: profile must exist before bio/skills):
   *
   *   0. Guard — abort early if no auth token is present.
   *   1. Fetch skill name→ID map (cached after first call).
   *   2. Fetch identity types to resolve role label → backend integer ID.
   *   3. Create or update the user's profile record:
   *        GET /api/profile → 200 means exists → PATCH /api/profile
   *                        → 404 means new user  → POST  /api/profile
   *      If this step fails, bio and skills are skipped (they depend on it).
   *   4. Save bio (POST first, fall back to PATCH on 409/400).
   *      Only attempted after step 3 succeeds to avoid "User profile not found".
   *   5. Save curiosity skills (POST, fall back to PATCH on 409/400).
   *   6. Save user skills for canDo / learning / wantToImprove (POST each).
   *
   * Errors in steps 4–6 are collected and logged but do not block navigation.
   * Errors in step 3 abort steps 4–6 and are included in the returned list.
   *
   * @param {object} draft  – the full onboarding draft object
   * @returns {Promise<{ errors: Array<{section: string, status: number|null, message: string}> }>}
   */
  async submitOnboardingDraft(draft) {
    /** @type {Array<{section: string, status: number|null, message: string}>} */
    const errors = [];

    // ── 0. Auth token guard ──────────────────────────────────────────────
    const token =
      localStorage.getItem("evolv_auth_token") ||
      sessionStorage.getItem("evolv_auth_token") ||
      null;

    if (!token) {
      const msg = "No auth token found — user must be logged in to complete onboarding.";
      console.error("[profileService]", msg);
      return { errors: [{ section: "auth", status: 401, message: msg }] };
    }

    // ── 1. Skill name→ID map ─────────────────────────────────────────────
    let skillMap = {};
    try {
      skillMap = await profileService.fetchSkillNameToIdMap();
    } catch (err) {
      console.error("[profileService] Failed to build skill map:", err);
      errors.push({ section: "skill-map", status: err.status ?? null, message: err.message });
    }

    // ── 2. Identity types (role label → backend integer ID) ──────────────
    let identityTypes = [];
    try {
      const res = await profileService.getIdentityTypes();
      identityTypes = Array.isArray(res) ? res : (res?.data ?? []);
    } catch (err) {
      console.error("[profileService] Failed to fetch identity types:", err);
      errors.push({ section: "identity-types", status: err.status ?? null, message: err.message });
    }

    // ── 3. Create or update the user's profile record ────────────────────
    //
    // The backend returns 404 from PATCH /api/profile when no record exists
    // for the authenticated user. We must POST to create it first.
    // Using ensureProfile() which does GET → POST (create) or PATCH (update).
    //
    // Bio and skills depend on this step. If it fails, we skip them to avoid
    // cascading "User profile not found" errors.
    const roleName =
      draft.role === "Other"
        ? (draft.customRole ?? "").trim()
        : (draft.role ?? "").trim();

    const identityTypeId = roleName
      ? profileService.mapRoleToIdentityTypeId(roleName, identityTypes)
      : null;

    let profileSaved = false;

    if (draft.username?.trim()) {
      const countryCode = getCountryCode(draft.country);
      const profileBody = {
        username: draft.username.trim(),
        // Only include countryCode when it resolves to a valid 2-letter ISO code.
        // getCountryCode() returns "" for unknown/unset countries; omitting
        // the key avoids the backend's "must be a 2-letter uppercase code" 400.
        ...(countryCode ? { countryCode } : {}),
        ...(draft.ageRange ? { ageRange: draft.ageRange } : {}),
        ...(identityTypeId != null
          ? {
              identityTypeIds: [identityTypeId],
              primaryIdentityTypeId: identityTypeId,
            }
          : {}),
      };

      try {
        await profileService.ensureProfile(profileBody, draft.profilePhotoFile);
        profileSaved = true;
        console.debug("[profileService] ✓ Profile created/updated");
      } catch (err) {
        console.error(
          `[profileService] Profile save failed (status ${err.status ?? "?"}):\n` +
          `  message: ${err.message}\n` +
          `  payload: ${JSON.stringify(err.payload ?? {})}`
        );
        errors.push({ section: "profile", status: err.status ?? null, message: err.message });
      }
    } else {
      // username is empty — should not reach here due to frontend gating,
      // but handle defensively.
      console.warn("[profileService] Skipping profile save — username is empty.");
      errors.push({ section: "profile", status: null, message: "Username is empty; profile not saved." });
    }

    // ── 3.5. Avatar upload ───────────────────────────────────────────────
    //
    // Only runs when the user selected a new image (draft.profilePhotoFile is a
    // File object). If no new file was picked, this step is skipped entirely so
    // an existing Cloudinary avatar is never overwritten with null.
    //
    // The upload is attempted even if the profile save failed so that partial
    // re-submissions can still sync the avatar. The endpoint is:
    //   POST /api/profile/avatar  (multipart/form-data, field: "avatar")
    //
    if (draft.profilePhotoFile instanceof File) {
      try {
        const avatarResult = await profileService.uploadAvatar(draft.profilePhotoFile);
        console.debug(
          "[profileService] ✓ Avatar uploaded →",
          avatarResult?.avatarUrl ??
          avatarResult?.profile?.avatarUrl ??
          "(url in payload above)"
        );
      } catch (err) {
        // Avatar upload failure is recorded but never blocks profile navigation.
        console.error(
          `[profileService] Avatar upload failed (status ${err.status ?? "?"}):\n` +
          `  message: ${err.message}\n` +
          `  payload: ${JSON.stringify(err.payload ?? {})}`
        );
        errors.push({ section: "avatar", status: err.status ?? null, message: err.message });
      }
    } else if (draft.profilePhoto && !draft.profilePhoto.startsWith("data:")) {
      // profilePhoto is already a remote URL (e.g. Cloudinary) from a previous
      // session — no upload needed; the backend already has it.
      console.debug("[profileService] Avatar is already a remote URL — skipping upload.");
    } else if (draft.profilePhoto?.startsWith("data:")) {
      // User selected a photo (data URL exists) but File was lost (e.g. page
      // reload mid-onboarding). Log a warning so it is visible in the console.
      console.warn(
        "[profileService] profilePhoto is a data URL but profilePhotoFile is not a File. " +
        "Avatar will not be uploaded. The user can re-select the photo after reload."
      );
    }

    // ── 4. Bio ────────────────────────────────────────────────────────────
    //
    // Only attempt if the profile was saved/confirmed in step 3.
    // saveBio() uses POST first, falling back to PATCH on 409 (already exists).
    const bioText = (draft.bio ?? draft.focusGoal ?? "").trim();

    if (bioText && profileSaved) {
      try {
        await profileService.saveBio(bioText);
        console.debug("[profileService] ✓ Bio saved");
      } catch (err) {
        console.error(
          `[profileService] Bio save failed (status ${err.status ?? "?"}):\n` +
          `  message: ${err.message}\n` +
          `  payload: ${JSON.stringify(err.payload ?? {})}`
        );
        errors.push({ section: "bio", status: err.status ?? null, message: err.message });
      }
    } else if (bioText && !profileSaved) {
      const msg = "Skipping bio save — parent profile was not successfully created.";
      console.warn("[profileService]", msg);
      errors.push({ section: "bio", status: null, message: msg });
    }

    // ── 5. Curiosity skills ──────────────────────────────────────────────
    const curiosityIds = profileService.mapNamesToIds(
      draft.curiosities ?? [],
      skillMap
    );

    if (curiosityIds.length > 0) {
      try {
        await profileService.createUserCuriosity(curiosityIds);
        console.debug("[profileService] ✓ Curiosity skills submitted");
      } catch (err) {
        // 409 / 400 = curiosity row already exists → update instead
        if (err.status === 409 || err.status === 400) {
          try {
            await profileService.updateUserCuriosity(curiosityIds);
            console.debug("[profileService] ✓ Curiosity skills updated (PATCH)");
          } catch (patchErr) {
            console.error(
              `[profileService] Curiosity PATCH failed (status ${patchErr.status ?? "?"}):\n` +
              `  message: ${patchErr.message}`
            );
            errors.push({ section: "curiosity", status: patchErr.status ?? null, message: patchErr.message });
          }
        } else {
          console.error(
            `[profileService] POST /api/skills/curiosity failed (status ${err.status ?? "?"}):\n` +
            `  message: ${err.message}`
          );
          errors.push({ section: "curiosity", status: err.status ?? null, message: err.message });
        }
      }
    }

    // ── 6. User skills (canDo / learning / wantToImprove) ────────────────
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
          `[profileService] POST /api/skills/user-skills (${relationshipType}) failed` +
          ` (status ${err.status ?? "?"}):\n  message: ${err.message}`
        );
        errors.push({
          section: `user-skills-${relationshipType}`,
          status: err.status ?? null,
          message: err.message,
        });
      }
    }

    if (errors.length > 0) {
      console.warn(
        "[profileService] Submission completed with errors:",
        errors.map((e) => `[${e.section}] ${e.status ?? "?"} — ${e.message}`)
      );
    } else {
      console.debug("[profileService] ✓ All profile sections submitted successfully");
    }

    return { errors };
  },
};

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

import { getCountryCode, COUNTRIES } from "../components/onboarding/onboardingData.js";

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
let _skillIdToNameCache = null;

// ─── Public service object ────────────────────────────────────────────────────

export const profileService = {
  /**
 * Load the saved profile and convert it to the onboarding draft shape.
 * Returns null if the user has no profile yet (new user).
 */
  async loadDraftFromBackend() {
    let profile;
    try {
      const res = await profileService.getProfile();
      profile = res?.data ?? res?.profile ?? res;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }

    const unwrap = (r) => (Array.isArray(r) ? r : r?.data ?? r?.items ?? []);
    const val = (r) => (r.status === "fulfilled" ? r.value : null);

    const [bioRes, idsRes, curRes, skillsRes, typesRes, idToName] = await Promise.allSettled([
      profileService.getBio(),
      profileService.getUserIdentities(),
      profileService.getUserCuriosity(),
      profileService.getUserSkills(),
      profileService.getIdentityTypes(),
      profileService.fetchSkillIdToNameMap(),
    ]);
    const skillName = (id) => (val(idToName) ?? {})[Number(id)] ?? "";

    // role: identityTypeId -> name
    const identities = unwrap(val(idsRes));
    const primary = identities.find((i) => i.isPrimary) ?? identities[0];
    const types = unwrap(val(typesRes));
    const role = types.find((t) => t.id === primary?.identityTypeId)?.name ?? "";

    // country: code -> name
    const code = profile?.countryCode ?? "";
    const country = COUNTRIES.find((c) => getCountryCode(c) === code) ?? "";

    // curiosities
    const curiosities = unwrap(val(curRes)).map((r) => skillName(r.skillId)).filter(Boolean);

    // user skills grouped by relationshipType
    const skills = { canDo: [], learning: [], wantToImprove: [] };
    const keyOf = { CAN_DO: "canDo", LEARNING: "learning", WANT_TO_IMPROVE: "wantToImprove" };
    unwrap(val(skillsRes)).forEach((row) => {
      const key = keyOf[row.relationshipType];
      const n = skillName(row.skillId);
      if (key && n) skills[key].push(n);
    });

    const bioRaw = val(bioRes);
    const bio = bioRaw?.bio ?? bioRaw?.data?.bio ?? profile?.bio ?? "";

    return {
      name: profile?.name ?? profile?.username ?? "",
      username: profile?.username ?? "",
      profilePhoto: profile?.avatarUrl ?? null,
      profilePhotoFile: null,
      role,
      customRole: "",
      country,
      ageRange: profile?.ageRange ?? "",
      curiosities,
      customCuriosity: "",
      skills,
      focusDomains: [],
      focusSkills: [],
      focusGoal: bio,
      bio,
    };
  },

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
   */


  async createProfile(data, file) {
    const url = `${API_BASE_URL}/api/profile`;
    const token = getToken();
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, String(v)));
      } else {
        formData.append(key, String(value));
      }
    });

    if (file instanceof File) formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    console.debug("[profileService] createProfile", response.status, payload);

    if (!response.ok) {
      const msg = Array.isArray(payload.message)
        ? payload.message.join(" ")
        : payload.message || "Profile creation failed.";
      const err = new Error(msg);
      err.status = response.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  },

  /**
   * PATCH /api/profile – updates an existing profile record.
   * body: { username, ageRange, identityTypeIds, primaryIdentityTypeId }
   */
  updateProfile(data) {
    return request("/api/profile", { method: "PATCH", body: data });
  },

  /**
   * Upsert helper: GET to check existence, then POST (create) or PATCH (update).
   *
   * @param {object} data – profile payload
   * @returns {Promise<any>}
   */
  async ensureProfile(data, file) {
    let profileExists = false;

    try {
      await profileService.getProfile();
      profileExists = true;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    if (profileExists) {
      const updated = await profileService.updateProfile(data);
      return { created: false, data: updated };
    }

    if (!(file instanceof File)) {
      throw new Error("Avatar image is required. Please select a profile photo.");
    }

    const created = await profileService.createProfile(data, file);
    return { created: true, data: created };
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

  /** GET /api/profile/complete */
  getCompleteProfile() {
    return request("/api/profile/complete");
  },

  /** GET /api/profile/bio */
  getBio() {
    return request("/api/profile/bio");
  },

  /**
   * POST /api/profile/bio – creates the bio record for the first time.
   */
  createBio(bio) {
    return request("/api/profile/bio", { method: "POST", body: { bio } });
  },

  /**
   * PATCH /api/profile/bio – updates an existing bio record.
   */
  updateBio(bio) {
    return request("/api/profile/bio", { method: "PATCH", body: { bio } });
  },

  /**
   * @param {string} bio
   * @returns {Promise<any>}
   */
  async saveBio(bio, isEdit = false) {
    if (isEdit) {
      try {
        return await profileService.updateBio(bio);
      } catch (err) {
        if (err.status !== 404) throw err;
        return profileService.createBio(bio);
      }
    }
    try {
      return await profileService.createBio(bio);
    } catch (createErr) {
      if (createErr.status === 409 || createErr.status === 400) {
        return profileService.updateBio(bio);
      }
      throw createErr;
    }
  },

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

  updateUserCuriosity(skillIds) {
    return request("/api/skills/curiosity", {
      method: "PATCH",
      body: { skillIds },
    });
  },

  deleteUserCuriosity(skillId) {
    return request(`/api/skills/curiosity/${skillId}`, { method: "DELETE" });
  },

  /** Skill IDs currently saved as curiosity. */
  async getCuriositySkillIds() {
    const res = await profileService.getUserCuriosity();
    const rows = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
    return rows.map((r) => Number(r.skillId)).filter((n) => !Number.isNaN(n));
  },

  /** Make saved curiosity match `skillIds` exactly, without using PATCH. */
 async syncCuriosity(skillIds) {
  const wanted = [...new Set(skillIds.map(Number))];

  const res = await profileService.getUserCuriosity();
  const rows = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
  const current = rows.map((r) => Number(r.skillId)).filter((n) => !Number.isNaN(n));

  const toAdd = wanted.filter((id) => !current.includes(id));
  const rowsToRemove = rows.filter((r) => !wanted.includes(Number(r.skillId)));

  // Add first, so a failure never leaves the user with an empty list.
  if (toAdd.length > 0) await profileService.createUserCuriosity(toAdd);

  // Delete one by one (no parallel requests).
  for (const row of rowsToRemove) {
    try {
      await profileService.deleteUserCuriosity(row.skillId);
    } catch (err) {
      // Fallback: backend may expect the row id. Guard so we never
      // accidentally delete a skill the user wants to keep.
      const canTryRowId =
        err.status === 500 &&
        row.id != null &&
        Number(row.id) !== Number(row.skillId) &&
        !wanted.includes(Number(row.id));

      if (canTryRowId) {
        await profileService.deleteUserCuriosity(row.id);
      } else {
        throw err;
      }
    }
  }
},

  /** For the profile modal: takes skill names, saves curiosity. */
  async saveCuriosityByNames(names) {
    const map = await profileService.fetchSkillNameToIdMap();
    const ids = profileService.mapNamesToIds(names, map);
    await profileService.syncCuriosity(ids);
    return ids;
  },

  /**
   * Sync "can do / learning / want to improve".
   * wanted = { CAN_DO: number[], LEARNING: number[], WANT_TO_IMPROVE: number[] }
   */
  async syncUserSkills(wanted) {
    const res = await profileService.getUserSkills();
    const rows = Array.isArray(res) ? res : res?.data ?? [];
    const keyOf = (type, id) => `${type}:${Number(id)}`;

    const have = new Map(rows.map((r) => [keyOf(r.relationshipType, r.skillId), r.id]));
    const want = new Set();
    Object.entries(wanted).forEach(([type, ids]) =>
      ids.forEach((id) => want.add(keyOf(type, id)))
    );

    for (const [type, ids] of Object.entries(wanted)) {
      const toAdd = [...new Set(ids.map(Number))].filter((id) => !have.has(keyOf(type, id)));
      if (toAdd.length > 0) await profileService.addUserSkill(toAdd, type);
    }

    const toRemove = [...have.entries()].filter(([k]) => !want.has(k)).map(([, rowId]) => rowId);
    await Promise.all(toRemove.map((rowId) => profileService.deleteUserSkill(rowId)));
  },

  /** GET /api/skills/user-skills */
  getUserSkills() {
    return request("/api/skills/user-skills");
  },

  addUserSkill(skillIds, relationshipType) {
    return request("/api/skills/user-skills", {
      method: "POST",
      body: { skill: skillIds, relationshipType },
    });
  },

  /**
   * PATCH /api/skills/user-skills/:id
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
  /**
 * Make saved skills match the profile-page modal selection.
 * - Deselected skills are removed everywhere they appear.
 * - Skills already saved keep their category (can do / learning / interest).
 * - Newly selected skills are added as `newSkillAs`
 *   ("curiosity" | "CAN_DO" | "LEARNING" | "WANT_TO_IMPROVE").
 */
async applySkillSelection(selectedNames, { newSkillAs = "curiosity" } = {}) {
  const [nameToId, idToName, usRes, curRes] = await Promise.all([
    profileService.fetchSkillNameToIdMap(),
    profileService.fetchSkillIdToNameMap(),
    profileService.getUserSkills(),
    profileService.getUserCuriosity(),
  ]);
  const rowsOf = (r) => (Array.isArray(r) ? r : r?.data ?? r?.items ?? []);
  const userSkillRows = rowsOf(usRes);
  const curiosityRows = rowsOf(curRes);

  const selected = new Set(profileService.mapNamesToIds([...selectedNames], nameToId));
  const saved = new Set([
    ...userSkillRows.map((r) => Number(r.skillId)),
    ...curiosityRows.map((r) => Number(r.skillId)),
  ]);

  // Only remove skills the user could actually see (the id resolves to a name).
  const visible = (id) => idToName[Number(id)] != null;
  const toAdd = [...selected].filter((id) => !saved.has(id));
  const userSkillsToRemove = userSkillRows.filter(
    (r) => visible(r.skillId) && !selected.has(Number(r.skillId))
  );
  const curiosityToRemove = curiosityRows.filter(
    (r) => visible(r.skillId) && !selected.has(Number(r.skillId))
  );

  const failures = [];

  // Add first, so a failure never leaves the user with fewer skills than before.
  if (toAdd.length > 0) {
    try {
      if (newSkillAs === "curiosity") await profileService.createUserCuriosity(toAdd);
      else await profileService.addUserSkill(toAdd, newSkillAs);
    } catch (e) {
      failures.push(e);
    }
  }

  const removals = await Promise.allSettled([
    // user-skills: DELETE /api/skills/user-skills/:id takes the row id
    ...userSkillsToRemove.map((r) => profileService.deleteUserSkill(r.id)),
    // curiosity: DELETE /api/skills/curiosity/:skillId takes the skill id
    ...curiosityToRemove.map((r) => profileService.deleteUserCuriosity(r.skillId)),
  ]);
  removals.forEach((r) => r.status === "rejected" && failures.push(r.reason));

  if (failures.length > 0) {
    console.error("[profileService] applySkillSelection failures:", failures);
    throw failures[0];
  }
  return { added: toAdd.length, removed: userSkillsToRemove.length + curiosityToRemove.length };
},
  /**
   * GET /api/posts/my-posts/counts
   * @returns {Promise<{ totalPosts: number, imageCount: number, videoCount: number, documentCount: number }>}
   */
  async getMyPostCounts() {
    const payload = await request("/api/posts/my-posts/counts");
    // Backend returns { success, data: { totalPosts, imageCount, videoCount, documentCount } }
    const data = payload?.data ?? payload;
    return {
      totalPosts: Number(data?.totalPosts ?? 0),
      imageCount: Number(data?.imageCount ?? 0),
      videoCount: Number(data?.videoCount ?? 0),
      documentCount: Number(data?.documentCount ?? 0),
    };
  },
  /**
   * Builds a { "skill name (lower-cased)": backendId }
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
    const idMap = {};
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
          idMap[Number(skill.id)] = skill.name;
        }
      }
    }

    _skillNameToIdCache = map;
    _skillIdToNameCache = idMap;
    console.debug(
      `[profileService] Skill name→ID map built: ${Object.keys(map).length} entries`
    );
    return map;
  },

  /**
   * Builds an inverted { backendId: "Skill Name" } map from category skills.
   *
   * @returns {Promise<Record<number, string>>}
   */
  async fetchSkillIdToNameMap() {
    if (_skillIdToNameCache) return _skillIdToNameCache;
    await profileService.fetchSkillNameToIdMap();
    return _skillIdToNameCache || {};
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

  /**
   * Submit the complete onboarding draft to the backend.
   * @param {object} draft  – the full onboarding draft object
   * @returns {Promise<{ errors: Array<{section: string, status: number|null, message: string}> }>}
   */
  async submitOnboardingDraft(draft, { isEdit = false } = {}) {
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
    // Rebuild the File if the page was reloaded (File objects can't be saved in localStorage)
    let photoFile = draft.profilePhotoFile;
    if (!(photoFile instanceof File) && draft.profilePhoto?.startsWith("data:")) {
      try {
        const blob = await (await fetch(draft.profilePhoto)).blob();
        photoFile = new File([blob], "avatar.jpg", { type: blob.type || "image/jpeg" });
      } catch (e) {
        console.error("[profileService] Could not rebuild photo file", e);
      }
    }
    const roleName =
      draft.role === "Other"
        ? (draft.customRole ?? "").trim()
        : (draft.role ?? "").trim();

    const identityTypeId = roleName
      ? profileService.mapRoleToIdentityTypeId(roleName, identityTypes)
      : null;
    let profileSaved = false;
    let profileCreated = false;

    if (draft.username?.trim()) {
      const countryCode = getCountryCode(draft.country);
      const profileBody = {
        username: draft.username.trim(),
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
        const res = await profileService.ensureProfile(profileBody, photoFile);
        profileSaved = true;
        profileCreated = res.created;
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
    //   POST /api/profile/avatar  (multipart/form-data, field: "avatar")
    if (profileSaved && !profileCreated && photoFile instanceof File) {
      try {
        const avatarResult = await profileService.uploadAvatar(photoFile); console.debug(
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
      console.debug("[profileService] Avatar is already a remote URL — skipping upload.");
    } else if (draft.profilePhoto?.startsWith("data:")) {
      console.warn(
        "[profileService] profilePhoto is a data URL but profilePhotoFile is not a File. " +
        "Avatar will not be uploaded. The user can re-select the photo after reload."
      );
    }

    // ── 4. Bio ────────────────────────────────────────────────────────────
    const bioText = (draft.bio ?? draft.focusGoal ?? "").trim();

    if (bioText && profileSaved) {
      try {
        await profileService.saveBio(bioText, isEdit);
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
        if (isEdit) {
          await profileService.syncCuriosity(curiosityIds);
        } else {
          try {
            await profileService.createUserCuriosity(curiosityIds);
          } catch (err) {
            // 409/400 = rows already exist, so sync instead of PATCH
            if (err.status === 409 || err.status === 400) {
              await profileService.syncCuriosity(curiosityIds);
            } else {
              throw err;
            }
          }
        }
        console.debug("[profileService] ✓ Curiosity skills saved");
      } catch (err) {
        console.error(
          `[profileService] Curiosity save failed (status ${err.status ?? "?"}): ${err.message}`
        );
        errors.push({ section: "curiosity", status: err.status ?? null, message: err.message });
      }
    }

    // ── 6. User skills (canDo / learning / wantToImprove) ────────────────
    const skillSections = [
      { key: "canDo", relationshipType: "CAN_DO" },
      { key: "learning", relationshipType: "LEARNING" },
      { key: "wantToImprove", relationshipType: "WANT_TO_IMPROVE" },
    ];
    if (isEdit) {
      try {
        const existing = await profileService.getUserSkills();
        const rows = Array.isArray(existing) ? existing : existing?.data ?? [];
        await Promise.allSettled(rows.map((r) => profileService.deleteUserSkill(r.id)));
      } catch (e) {
        console.error('[profileService] Could not clear old user skills', e);
      }
    }

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

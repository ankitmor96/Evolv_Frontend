/**
 * EVOLV Profile Service
 * Endpoint base: VITE_API_BASE_URL (same env var used by authService.js).
 * Token:         "evolv_auth_token" from localStorage or sessionStorage.
 *
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
 */
import { getCountryCode, COUNTRIES, CURIOSITY_DOMAINS } from "../components/onboarding/onboardingData.js";
import { forceLogout } from './sessionService.js';
import { homePostService } from './homePostService.js';
import { fetchProfileOnce, invalidateProfile } from "./profileFetch.js";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

/** Token key matches authService.js exactly. */
const TOKEN_KEY = "evolv_auth_token";
const AVATAR_FIELD = "file";

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
  if (response.status === 401 && token) {
    forceLogout();
  }
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
let _skillNameToIdCache = null;
let _skillIdToNameCache = null;
let _skillMapPromise = null;

// Everything we've ever learned about skills. Never thrown away,
// so one flaky request can't make a known skill "disappear".
const _knownNameToId = {};
const _knownIdToName = {};
const SKILL_CATEGORY_COUNT = 20;

// ─── Public service object ────────────────────────────────────────────────────

export const profileService = {
  /**
 * Load the saved profile and convert it to the onboarding draft shape.
 * Returns null if the user has no profile yet (new user).
 */
  async loadDraftFromBackend() {
    const profile = await fetchProfileOnce();
    if (!profile) return null;

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

    if (!token) {
      const error = new Error(
        "No authentication token found. Please log in again."
      );
      error.status = 401;
      throw error;
    }

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, String(v)));
      } else {
        formData.append(key, String(value));
      }
    });

    if (file instanceof File) formData.append(AVATAR_FIELD, file);

    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (response.status === 401 && token) {
      forceLogout();
    }

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
  // async ensureProfile(data, file) {
  //   const existing = await fetchProfileOnce();

  //   try {
  //     const res = await profileService.getProfile();
  //     existing = res?.data?.profile ?? res?.data ?? res?.profile ?? res ?? {};
  //   } catch (err) {
  //     if (err.status !== 404) throw err;
  //   }

  //   if (existing) {
  //     const body = { ...data };
  //     if (existing.username && existing.username === body.username) {
  //       delete body.username;
  //     }
  //     if (Object.keys(body).length === 0) {
  //       return { created: false, data: existing };
  //     }
  //     const updated = await profileService.updateProfile(body);
  //     return { created: false, data: updated };
  //   }

  //   if (!(file instanceof File)) {
  //     throw new Error("Avatar image is required. Please select a profile photo.");
  //   }

  //   const created = await profileService.createProfile(data, file);
  //   return { created: true, data: created };
  // },
  async ensureProfile(data, file) {
    const existing = await fetchProfileOnce();

    if (existing) {
      const body = { ...data };
      if (existing.username && existing.username === body.username) {
        delete body.username;
      }
      if (Object.keys(body).length === 0) {
        return { created: false, data: existing };
      }
      const updated = await profileService.updateProfile(body);
      invalidateProfile();
      return { created: false, data: updated };
    }

    if (!(file instanceof File)) {
      throw new Error("Avatar image is required. Please select a profile photo.");
    }

    const created = await profileService.createProfile(data, file);
    invalidateProfile();
    return { created: true, data: created };
  },
  async deleteAccount() {
    const res = await request("/api/auth/delete-account", { method: "DELETE" });
    if (res?.success === false) {
      throw new Error(res?.message || "Could not delete your account.");
    }
    return res;
  },

  /**
   * POST /api/profile/avatar – uploads a profile photo to Cloudinary via the backend.
   * @param {File} file – the image File selected by the user
   * @returns {Promise<any>} – parsed response; contains { avatarUrl } on success
   */
  async uploadAvatar(file) {
    const url = `${API_BASE_URL}/api/profile/avatar`;
    const token = getToken();

    const formData = new FormData();
    formData.append(AVATAR_FIELD, file);

    console.debug(`[profileService] POST ${url} (multipart avatar upload)`);

    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (response.status === 401 && token) {
      forceLogout();
    }

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
    invalidateProfile();
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
   */
  selectUserIdentities(identityTypeIds, primaryIdentityTypeId) {
    return request("/api/user-identities/select", {
      method: "POST",
      body: { identityTypeIds, primaryIdentityTypeId },
    });
  },

  /**
   * PATCH /api/user-identities/:id
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
 * Save the "Edit Skills" modal.
 * buckets = {
 *   CAN_DO: string[], LEARNING: string[],
 *   WANT_TO_IMPROVE: string[], CURIOSITY: string[]   // skill NAMES
 * }
 */
  async saveSkillBuckets(buckets) {
    const USER_TYPES = ["CAN_DO", "LEARNING", "WANT_TO_IMPROVE"];
    const allNames = [
      ...USER_TYPES.flatMap((t) => buckets[t] ?? []),
      ...(buckets.CURIOSITY ?? []),
    ];
    const norm = (n) => n.toLowerCase().trim();

    let nameToId = await profileService.fetchSkillNameToIdMap();
    let missing = allNames.filter((n) => nameToId[norm(n)] == null);

    // One retry with a fresh map before giving up
    if (missing.length > 0) {
      profileService.invalidateSkillMap();
      nameToId = await profileService.fetchSkillNameToIdMap();
      missing = allNames.filter((n) => nameToId[norm(n)] == null);
    }
    // Don't block the whole save: skip unknown names, save the rest,
    // and tell the user about the skipped ones at the end.
    const missingSet = new Set(missing.map(norm));
    const skipUnknown = (names = []) => names.filter((n) => !missingSet.has(norm(n)));
    const skippedNames = [...new Set(missing)];

    const [idToName, usRes, curRes] = await Promise.all([
      profileService.fetchSkillIdToNameMap(),
      profileService.getUserSkills(),
      profileService.getUserCuriosity(),
    ]);

    const rowsOf = (r) => (Array.isArray(r) ? r : r?.data ?? r?.items ?? []);
    const toIds = (names = []) =>
      [...new Set(profileService.mapNamesToIds(skipUnknown(names), nameToId))];
    const visible = (id) => idToName[Number(id)] != null;
    const keyOf = (type, id) => `${type}:${Number(id)}`;

    // ── user-skills (can do / learning / want to improve) ──
    const wantedByType = Object.fromEntries(
      USER_TYPES.map((t) => [t, toIds(buckets[t])])
    );
    const wantedKeys = new Set(
      USER_TYPES.flatMap((t) => wantedByType[t].map((id) => keyOf(t, id)))
    );

    const userRows = rowsOf(usRes);
    const haveKeys = new Set(userRows.map((r) => keyOf(r.relationshipType, r.skillId)));
    const userRowsToRemove = userRows.filter(
      (r) =>
        USER_TYPES.includes(r.relationshipType) &&
        visible(r.skillId) &&
        !wantedKeys.has(keyOf(r.relationshipType, r.skillId))
    );

    // ── curiosity ──
    const wantedCuriosity = toIds(buckets.CURIOSITY);
    const curRows = rowsOf(curRes);
    const curCurrent = new Set(curRows.map((r) => Number(r.skillId)));
    const curToAdd = wantedCuriosity.filter((id) => !curCurrent.has(id));
    const curToRemove = curRows.filter(
      (r) => visible(r.skillId) && !wantedCuriosity.includes(Number(r.skillId))
    );

    const failures = [];
    const attempt = async (fn) => {
      try { await fn(); } catch (e) { failures.push(e); }
    };

    // 1) Remove first (one by one) so a skill moved between lists never clashes
    for (const row of userRowsToRemove) {
      await attempt(() => profileService.deleteUserSkill(row.id));
    }

    // 2) Add new skills for each list
    for (const type of USER_TYPES) {
      const ids = wantedByType[type].filter((id) => !haveKeys.has(keyOf(type, id)));
      if (ids.length > 0) await attempt(() => profileService.addUserSkill(ids, type));
    }

    // 3) Curiosity: add, then remove
    if (curToAdd.length > 0) {
      await attempt(() => profileService.createUserCuriosity(curToAdd));
    }
    for (const row of curToRemove) {
      await attempt(async () => {
        try {
          await profileService.deleteUserCuriosity(row.skillId);
        } catch (err) {
          const canTryRowId =
            err.status === 500 &&
            row.id != null &&
            Number(row.id) !== Number(row.skillId) &&
            !wantedCuriosity.includes(Number(row.id));
          if (canTryRowId) await profileService.deleteUserCuriosity(row.id);
          else throw err;
        }
      });
    }

    if (failures.length > 0) {
      console.error("[profileService] saveSkillBuckets failures:", failures);
      throw failures[0];
    }
    if (skippedNames.length > 0) {
      throw new Error(
        `Saved the rest, but these skills aren't on the server yet: ${skippedNames.join(", ")}`
      );
    }
    return { ok: true };
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

  // GET /api/posts/my-posts/engagement-counts
  async getMyEngagementCounts() {
    const posts = await homePostService.getMyPosts();

    const results = await Promise.allSettled(
      posts.map((p) => homePostService.getReactions(p.id))
    );

    let appreciation = 0;
    let helpful = 0;
    let learned = 0;

    results.forEach((r, i) => {
      const counts = r.status === 'fulfilled' ? (r.value?.counts ?? {}) : {};
      appreciation += Number(counts.APPRECIATE ?? posts[i].appreciations ?? 0);
      helpful += Number(counts.HELPFUL ?? posts[i].helpfulCount ?? 0);
      learned += Number(counts.LEARNED ?? posts[i].learnedCount ?? 0);
    });

    return { appreciation, helpful, learned };
  },

  /** Forget the "complete" flag so the next call re-checks the server.
 *  (Known skills are kept, so nothing already learned is lost.) */
  invalidateSkillMap() {
    _skillNameToIdCache = null;
    _skillIdToNameCache = null;
    _skillMapPromise = null;
  },

  async fetchSkillNameToIdMap() {
    if (_skillNameToIdCache) return _skillNameToIdCache;
    if (_skillMapPromise) return _skillMapPromise; // de-dupe parallel callers

    _skillMapPromise = (async () => {
      const ingest = (data) => {
        const skills = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.skills)
              ? data.skills
              : [];
        for (const skill of skills) {
          if (skill?.name && skill?.id != null) {
            _knownNameToId[skill.name.toLowerCase().trim()] = Number(skill.id);
            _knownIdToName[Number(skill.id)] = skill.name;
          }
        }
      };

      let toTry = Array.from({ length: SKILL_CATEGORY_COUNT }, (_, i) => i + 1);

      // Up to 3 rounds: only failed categories are retried
      for (let attempt = 0; attempt < 3 && toTry.length > 0; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
        const failed = [];

        // Small batches of 5 (not 20 at once) so the server isn't flooded
        for (let i = 0; i < toTry.length; i += 5) {
          const chunk = toTry.slice(i, i + 5);
          const results = await Promise.allSettled(
            chunk.map((id) => profileService.getCategorySkills(id))
          );
          results.forEach((result, idx) => {
            if (result.status === "fulfilled") {
              ingest(result.value);
            } else if (result.reason?.status !== 404) {
              // 404 = category doesn't exist (fine). Anything else = retry.
              failed.push(chunk[idx]);
            }
          });
        }
        toTry = failed;
      }

      if (toTry.length === 0) {
        // Complete map: safe to cache
        _skillNameToIdCache = { ..._knownNameToId };
        _skillIdToNameCache = { ..._knownIdToName };
      } else {
        console.warn(
          `[profileService] categories still failing after retries: ${toTry.join(", ")}`
        );
      }
      return { ..._knownNameToId };
    })().finally(() => {
      _skillMapPromise = null;
    });

    return _skillMapPromise;
  },

  async fetchSkillIdToNameMap() {
    if (_skillIdToNameCache) return _skillIdToNameCache;
    await profileService.fetchSkillNameToIdMap();
    return _skillIdToNameCache || { ..._knownIdToName };
  },

    /** DEV ONLY: list skills from onboardingData.js that the server doesn't have. */
  async debugMissingSkills() {
    profileService.invalidateSkillMap();
    const map = await profileService.fetchSkillNameToIdMap();
    const all = [...new Set(CURIOSITY_DOMAINS.flatMap((d) => d.skills))];
    const missing = all.filter((n) => map[n.toLowerCase().trim()] == null);
    console.log(`Server knows ${Object.keys(map).length} skills.`);
    console.log("Missing from server:", missing);
    return missing;
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
        // Report any chosen skill that has no id on the server
    {
      const chosen = [
        ...(draft.curiosities ?? []),
        ...(draft.skills?.canDo ?? []),
        ...(draft.skills?.learning ?? []),
        ...(draft.skills?.wantToImprove ?? []),
      ];
      const notOnServer = [
        ...new Set(chosen.filter((n) => skillMap[n.toLowerCase().trim()] == null)),
      ];
      if (notOnServer.length > 0) {
        errors.push({
          section: "skills-missing",
          status: null,
          message: `These skills aren't on the server yet and were not saved: ${notOnServer.join(", ")}`,
        });
      }
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

    let identityTypeId = roleName
      ? profileService.mapRoleToIdentityTypeId(roleName, identityTypes)
      : null;

    // Custom roles usually have no matching type, so fall back to "Other"
    if (roleName && identityTypeId == null) {
      identityTypeId = profileService.mapRoleToIdentityTypeId("Other", identityTypes);
    }

    if (roleName && identityTypeId == null) {
      errors.push({
        section: "identity",
        status: null,
        message: `Role "${roleName}" was not found in the server's identity types.`,
      });
    }

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
    // ── 3.8. Make sure the role was actually stored ─────────────────────
    if (profileSaved && identityTypeId != null) {
      try {
        const res = await profileService.getUserIdentities();
        const list = Array.isArray(res) ? res : res?.data ?? [];
        if (list.length === 0) {
          await profileService.selectUserIdentities([identityTypeId], identityTypeId);
        }
      } catch (err) {
        errors.push({ section: "identity", status: err.status ?? null, message: err.message });
      }
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

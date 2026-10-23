/**
 * EVOLV User Skill Service
 *
 * Thin re-export wrapper around the verified User Skills methods
 * already implemented in profileService.js.
 *
 * Verified endpoints (from profileService.js docstring + Postman):
 *   GET    /api/skills/user-skills
 *   POST   /api/skills/user-skills         body: { skill: number[], relationshipType: string }
 *   PATCH  /api/skills/user-skills/:id     body: { skill: number[], relationshipType: string }
 *   DELETE /api/skills/user-skills/:id
 *
 * Relationship type enum values (verified):
 *   "CAN_DO" | "LEARNING" | "WANT_TO_IMPROVE"
 *
 * This file keeps the import surface clean for components that only
 * need user-skill operations, without importing the entire profileService.
 */

export {
  profileService as userSkillService,
} from "./profileService.js";

// Convenience re-exports for destructured imports
import { profileService } from "./profileService.js";
/**
 * GET /api/skills/user-skills
 * Returns the authenticated user's saved user-skill records.
 */
export const getUserSkills = () => profileService.getUserSkills();

/**
 * POST /api/skills/user-skills
 *
 * @param {number[]} skillIds       – backend integer skill IDs
 * @param {string}   relationshipType – "CAN_DO" | "LEARNING" | "WANT_TO_IMPROVE"
 */
export const addUserSkill = (skillIds, relationshipType) =>
  profileService.addUserSkill(skillIds, relationshipType);

/**
 * PATCH /api/skills/user-skills/:id
 *
 * @param {number}   id
 * @param {number[]} skillIds
 * @param {string}   relationshipType
 */
export const updateUserSkill = (id, skillIds, relationshipType) =>
  profileService.updateUserSkill(id, skillIds, relationshipType);

/**
 * DELETE /api/skills/user-skills/:id
 *
 * @param {number} id
 */
export const deleteUserSkill = (id) => profileService.deleteUserSkill(id);

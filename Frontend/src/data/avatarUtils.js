/**
 * Avatar URL utility — shared across home and explore pages.
 * Uses DiceBear avataaars (deterministic, no external brand).
 */
export function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

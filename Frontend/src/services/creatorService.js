/**
 * EVOLV Creator Service
 *
 * Handles creator discovery and recommendation logic.
 * Currently uses mock data; swap `fetchRecommendedCreators` for a real
 * API call when the backend is ready — the UI does not need to change.
 *
 * Future API endpoints:
 *   GET  /api/creators/recommended?interests=a,b,c
 *   GET  /api/creators/:id
 *   POST /api/connections  { fromUserId, toCreatorId }
 */
// ─── Avatar fallback helper ────────────────────────────────────────────────────
function avatarUrl(seed) {
  // DiceBear "avataaars" — deterministic, neutral, no external brand assets.
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ─── Mock creator pool ─────────────────────────────────────────────────────────
// Replace this array with an API response when the backend is available.
const MOCK_CREATORS = [
  {
    id: 'creator_01',
    username: 'priya_dev',
    displayName: 'Priya Sharma',
    profileImage: avatarUrl('priya_dev'),
    domain: 'Web Development',
    skills: ['React', 'JavaScript', 'Node.js', 'TypeScript'],
  },
  {
    id: 'creator_02',
    username: 'arjun.ai',
    displayName: 'Arjun Menon',
    profileImage: avatarUrl('arjun.ai'),
    domain: 'AI/ML',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'Data Analysis'],
  },
  {
    id: 'creator_03',
    username: 'zara_ux',
    displayName: 'Zara Khan',
    profileImage: avatarUrl('zara_ux'),
    domain: 'UI/UX',
    skills: ['Figma', 'Design Systems', 'User Research', 'Product Design'],
  },
  {
    id: 'creator_04',
    username: 'rishi_lens',
    displayName: 'Rishi Patel',
    profileImage: avatarUrl('rishi_lens'),
    domain: 'Photography',
    skills: ['Photography', 'Photo Editing', 'Lightroom', 'Storytelling'],
  },
  {
    id: 'creator_05',
    username: 'anika_creates',
    displayName: 'Anika Singh',
    profileImage: avatarUrl('anika_creates'),
    domain: 'Content Creation',
    skills: ['Copywriting', 'Blogging', 'Social Media Content', 'Video Editing'],
  },
  {
    id: 'creator_06',
    username: 'dev.aditya',
    displayName: 'Aditya Verma',
    profileImage: avatarUrl('dev.aditya'),
    domain: 'Software Development',
    skills: ['Python', 'Cloud', 'DevOps', 'Cybersecurity'],
  },
  {
    id: 'creator_07',
    username: 'neha_brands',
    displayName: 'Neha Gupta',
    profileImage: avatarUrl('neha_brands'),
    domain: 'Brand Design',
    skills: ['Graphic Design', 'Illustration', 'Brand Design', 'Typography'],
  },
  {
    id: 'creator_08',
    username: 'vikram.build',
    displayName: 'Vikram Rao',
    profileImage: avatarUrl('vikram.build'),
    domain: 'Entrepreneurship',
    skills: ['Entrepreneurship', 'Product Management', 'Business Strategy', 'Leadership'],
  },
  {
    id: 'creator_09',
    username: 'kavya_motion',
    displayName: 'Kavya Nair',
    profileImage: avatarUrl('kavya_motion'),
    domain: 'Animation',
    skills: ['Animation', 'Motion Design', '3D', 'Filmmaking'],
  },
  {
    id: 'creator_10',
    username: 'rohan.finance',
    displayName: 'Rohan Mehta',
    profileImage: avatarUrl('rohan.finance'),
    domain: 'FinTech',
    skills: ['Investing', 'Financial Analysis', 'FinTech', 'Stock Market'],
  },
  {
    id: 'creator_11',
    username: 'sara_mobile',
    displayName: 'Sara Thomas',
    profileImage: avatarUrl('sara_mobile'),
    domain: 'Mobile Development',
    skills: ['Mobile Development', 'React Native', 'Flutter', 'Swift'],
  },
  {
    id: 'creator_12',
    username: 'ansh.speak',
    displayName: 'Ansh Joshi',
    profileImage: avatarUrl('ansh.speak'),
    domain: 'Public Speaking',
    skills: ['Public Speaking', 'Debate', 'Communication', 'Storytelling'],
  },
];

// ─── Recommendation scoring ────────────────────────────────────────────────────
/**
 * Score a creator against a user's interest list.
 *   +3  primary domain exactly matches an interest
 *   +1  per matching skill tag
 * Sorted descending; ties preserve original order.
 */
function scoreCreator(creator, interests) {
  const interestSet = new Set(interests.map((i) => i.toLowerCase().trim()));
  let score = 0;

  if (interestSet.has(creator.domain.toLowerCase().trim())) score += 3;

  for (const skill of creator.skills) {
    if (interestSet.has(skill.toLowerCase().trim())) score += 1;
  }

  return score;
}

/**
 * Fetch recommended creators for the given interest list.
 *
 * Returns up to `limit` creators, sorted by relevance.
 * If interests is empty, all creators are returned in default order.
 *
 * @param {string[]} interests   - e.g. ['Web Development', 'AI/ML', 'UI/UX']
 * @param {number}   limit       - max results (default: 10)
 * @returns {Promise<Object[]>}  - resolves with scored + sorted creator list
 */
export async function fetchRecommendedCreators(interests = [], limit = 10) {
  // ── Simulate network latency (remove when using a real API) ──
  await new Promise((resolve) => setTimeout(resolve, 700));

  // TODO(backend): replace block below with:
  //   const resp = await fetch(`/api/creators/recommended?interests=${interests.join(',')}&limit=${limit}`);
  //   return resp.json();

  const scored = MOCK_CREATORS.map((c) => ({
    ...c,
    _score: scoreCreator(c, interests),
  }));

  scored.sort((a, b) => b._score - a._score);

  return scored.slice(0, limit);
}

/**
 * Send a connection request to a creator.
 *
 * @param {string} creatorId
 * @returns {Promise<{success: boolean}>}
 */
export async function connectToCreator(creatorId) {
  // ── Simulate network ──
  await new Promise((resolve) => setTimeout(resolve, 400));

  // TODO(backend): replace with:
  //   const resp = await fetch('/api/connections', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ toCreatorId: creatorId }),
  //   });
  //   return resp.json();

  console.log(`[creatorService] Connection request sent → ${creatorId}`);
  return { success: true };
}

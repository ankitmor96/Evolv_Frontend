/**
 * EVOLV Onboarding — data model, taxonomies, validation.
 *
 * Four steps: 01 IDENTITY · 02 CURIOSITY · 03 SKILLS · 04 FOCUS.
 * The draft matches the backend payload contract 1:1 so the API call is a
 * matter of swapping `saveDraft` for a POST at integration time.
 */

export const MIN_CURIOSITIES = 3;
export const MAX_CURIOSITIES = 10;
export const FOCUS_DOMAIN_MAX = 3;
export const GOAL_MAX = 160;

export const ROLE_OTHER = 'Other';

export const initialProfile = {
  name: '',
  username: '',
  profilePhoto: null, // dataURL (later: uploaded URL)
  role: '',
  customRole: '',
  country: '',
  ageRange: '',
  curiosities: [], // 3–10
  customCuriosity: '',
  skills: {
    canDo: [],
    learning: [],
    wantToImprove: [],
  },
  focusDomains: [], // 1–3 domain names the user is prioritising right now
  focusSkills: [], // optional skills inside those domains (subset)
  focusGoal: '',
  bio: '',
};

/** WHAT DESCRIBES YOU RIGHT NOW? — single select. */
export const ROLES = [
  'Student',
  'Builder',
  'Creator',
  'Developer',
  'Designer',
  'Entrepreneur',
  'Researcher',
  'Professional',
  'Freelancer',
  'Educator',
  'Artist',
  'Explorer',
  'Other',
];

/**
 * WHAT ARE YOU CURIOUS ABOUT? — a DOMAIN → SKILLS hierarchy.
 *
 * A domain is a broad area; the chips under it are the specific skills that
 * belong to that area. Selections are stored by skill name, so a skill listed
 * in two domains (e.g. Storytelling, Debate, Leadership) reads as selected in
 * both — one skill, one selection.
 */
export const CURIOSITY_DOMAINS = [
  {
    id: 'technology',
    label: 'TECHNOLOGY',
    skills: [
      'Python',
      'JavaScript',
      'AI/ML',
      'Cybersecurity',
      'Cloud',
      'DevOps',
      'Web Development',
      'Robotics',
      'Software Development',
      'Mobile Development',
      'Game Development',
      'Data Engineering',
      'Blockchain',
      'IoT',
      'AR/VR',
    ],
  },
  {
    id: 'design',
    label: 'DESIGN & CREATIVE',
    skills: [
      'UI/UX',
      'Graphic Design',
      'Illustration',
      '3D',
      'Animation',
      'Architecture',
      'Motion Design',
      'Product Design',
      'Brand Design',
      'Typography',
      'Visual Design',
    ],
  },
  {
    id: 'media',
    label: 'MEDIA & CONTENT',
    skills: [
      'Photography',
      'Videography',
      'Filmmaking',
      'Video Editing',
      'Photo Editing',
      'Storytelling',
      'Copywriting',
      'Content Creation',
      'Blogging',
      'Podcasting',
      'Social Media Content',
    ],
  },
  {
    id: 'business',
    label: 'BUSINESS & ENTREPRENEURSHIP',
    skills: [
      'Entrepreneurship',
      'Product Management',
      'Sales',
      'Marketing',
      'Digital Marketing',
      'Negotiation',
      'Business Strategy',
      'Operations',
      'E-commerce',
      'Leadership',
      'Business Development',
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE & ECONOMICS',
    skills: [
      'Investing',
      'Financial Analysis',
      'Economics',
      'Accounting',
      'Personal Finance',
      'Stock Market',
      'Banking',
      'FinTech',
      'Financial Planning',
      'Trading',
    ],
  },
  {
    id: 'science',
    label: 'SCIENCE & RESEARCH',
    skills: [
      'Physics',
      'Biology',
      'Chemistry',
      'Mathematics',
      'Astronomy',
      'Environmental Science',
      'Neuroscience',
      'Research Methodology',
      'Statistics',
      'Data Analysis',
    ],
  },
  {
    id: 'thinking',
    label: 'THINKING & INTELLECTUAL',
    skills: [
      'Critical Thinking',
      'Problem Solving',
      'Logic',
      'Philosophy',
      'Decision Making',
      'Reasoning',
      'Ethics',
      'Psychology',
      'Cognitive Science',
      'Debate',
    ],
  },
  {
    id: 'communication',
    label: 'COMMUNICATION',
    skills: [
      'Public Speaking',
      'Debate',
      'Writing',
      'Presentation',
      'Communication',
      'Storytelling',
      'Interviewing',
      'Persuasion',
      'Professional Communication',
      'Active Listening',
    ],
  },
  {
    id: 'languages',
    label: 'LANGUAGES & CULTURE',
    skills: [
      'English',
      'Hindi',
      'Gujarati',
      'Spanish',
      'French',
      'German',
      'Japanese',
      'Chinese',
      'Arabic',
      'Translation',
      'Linguistics',
      'Cultural Studies',
    ],
  },
  {
    id: 'arts',
    label: 'ARTS & PERFORMANCE',
    skills: [
      'Music',
      'Singing',
      'Guitar',
      'Piano',
      'Dance',
      'Acting',
      'Theatre',
      'Drawing',
      'Painting',
      'Sculpture',
      'Performance',
    ],
  },
  {
    id: 'practical',
    label: 'PRACTICAL & CRAFT',
    skills: [
      'Woodworking',
      'Electronics',
      'Welding',
      'Cooking',
      'Gardening',
      'DIY',
      'Carpentry',
      'Crafting',
      'Sewing',
      '3D Printing',
      'Repair & Maintenance',
    ],
  },
  {
    id: 'physical',
    label: 'PHYSICAL & OUTDOOR',
    skills: [
      'Running',
      'Cycling',
      'Trekking',
      'Swimming',
      'Yoga',
      'Martial Arts',
      'Football',
      'Cricket',
      'Basketball',
      'Hiking',
      'Strength Training',
      'Outdoor Adventure',
    ],
  },
  {
    id: 'leadership',
    label: 'LEADERSHIP & SOCIAL',
    skills: [
      'Leadership',
      'Teamwork',
      'Mentoring',
      'Community Building',
      'Networking',
      'Collaboration',
      'Conflict Resolution',
      'Relationship Building',
      'Volunteering',
      'Social Impact',
    ],
  },
  {
    id: 'education',
    label: 'EDUCATION & TEACHING',
    skills: [
      'Teaching',
      'Tutoring',
      'Curriculum Design',
      'Knowledge Sharing',
      'Instructional Design',
      'Educational Technology',
      'Coaching',
      'Mentoring',
      'Academic Research',
    ],
  },
  {
    id: 'life',
    label: 'LIFE & PERSONAL DEVELOPMENT',
    skills: [
      'Time Management',
      'Productivity',
      'Habit Building',
      'Goal Setting',
      'Self Improvement',
      'Mindfulness',
      'Personal Growth',
      'Emotional Intelligence',
      'Stress Management',
      'Decision Making',
    ],
  },
];

/** Every selectable preset skill, in authoring order. */
export const ALL_CURIOSITY_SKILLS = CURIOSITY_DOMAINS.flatMap((d) => d.skills);

/** Expanded on first load — the rest start collapsed to keep the step scannable. */
export const DEFAULT_EXPANDED_DOMAINS = ['technology', 'design', 'media', 'business'];

/**
 * WHAT ARE YOU FOCUSING ON? — 1–3 domains from the same taxonomy used in
 * step 02. Focus reuses the DOMAIN → SKILLS relationship: pick an area, then
 * optionally narrow down which skills inside it you're working on.
 * `name` (title case) is what gets stored and displayed.
 */
export const FOCUS_DOMAINS = CURIOSITY_DOMAINS.map((domain) => ({
  ...domain,
  name: domain.label
    .split(' ')
    .map((word) => (word === '&' ? word : word.charAt(0) + word.slice(1).toLowerCase()))
    .join(' '),
}));

export const SKILL_SECTIONS = [
  {
    id: 'canDo',
    title: 'I CAN DO',
    sub: "Things you're already comfortable doing.",
    placeholder: 'e.g. Python',
    hints: [
      'Python',
      'Photography',
      'Writing',
      'Video Editing',
      'Public Speaking',
      'JavaScript',
      'Graphic Design',
    ],
  },
  {
    id: 'learning',
    title: "I'M LEARNING",
    sub: "Things you're currently learning or practicing.",
    placeholder: 'e.g. UI/UX',
    hints: ['AI', 'Economics', 'UI/UX', 'React', 'Data Science', 'Communication'],
  },
  {
    id: 'wantToImprove',
    title: 'I WANT TO GET BETTER AT',
    sub: 'Skills you want to improve over time.',
    placeholder: 'e.g. Communication',
    hints: [
      'Leadership',
      'Entrepreneurship',
      'Communication',
      'Public Speaking',
      'Problem Solving',
      'Time Management',
    ],
  },
];

export const FOCUS_HINTS = [
  'Building. Learning. Growing.',
  'Code, create, and keep learning.',
  'Turning ideas into digital experiences.',
  'Learning to build, building to learn.',
  'Developer in progress 🚀',
];

export const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45+'];

export const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  "Côte d'Ivoire",
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czechia',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'São Tomé and Príncipe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Türkiye',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
];

// ─── Username rules ───────────────────────────────────────────────────────────
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function validateUsername(raw) {
  const v = raw.trim();
  if (v.length === 0) return null; // "required" handled separately for calm UX
  if (v.length < USERNAME_MIN) return `Min ${USERNAME_MIN} characters`;
  if (v.length > USERNAME_MAX) return `Max ${USERNAME_MAX} characters`;
  if (!USERNAME_RE.test(v)) return 'Letters, numbers and _ only';
  return null;
}

/** THE resolved role label — either the chosen chip or the custom "Other" text. */
export function resolvedRole(draft) {
  if (draft.role === ROLE_OTHER) return draft.customRole.trim();
  return draft.role;
}

export function totalSkills(draft) {
  return draft.skills.canDo.length + draft.skills.learning.length + draft.skills.wantToImprove.length;
}

/**
 * Per-step gating. Returns true when "Continue" unlocks.
 */
export function isStepComplete(step, draft) {
  switch (step) {
    case 1: {
      if (draft.name.trim().length === 0) return false;
      if (draft.username.trim().length === 0 || validateUsername(draft.username)) return false;
      if (!draft.role) return false;
      if (draft.role === ROLE_OTHER && draft.customRole.trim().length === 0) return false;
      return draft.country.trim().length > 0;
    }
    case 2:
      return draft.curiosities.length >= MIN_CURIOSITIES;
    case 3:
      return totalSkills(draft) > 0;
    case 4:
      return true;
    default:
      return false;
  }
}

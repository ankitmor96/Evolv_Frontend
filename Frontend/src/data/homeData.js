/**
 * EVOLV Home Page — Mock Data
 * All data is separated from UI for easy backend integration.
 * Replace these arrays with API responses when the backend is ready.
 */

import { avatarUrl } from './avatarUtils';
import { CURIOSITY_DOMAINS } from '../components/onboarding/onboardingData.js';

// ─── Creators ────────────────────────────────────────────────────────────────
export const CREATORS = [
  { id: 'c1', name: 'Arjun Menon',    username: 'arjun.ai',       field: 'AI Enthusiast',    avatar: avatarUrl('arjun_menon') },
  { id: 'c2', name: 'Priya Sharma',   username: 'priya_dev',      field: 'Web Developer',    avatar: avatarUrl('priya_sharma') },
  { id: 'c3', name: 'Zara Khan',      username: 'zara_ux',        field: 'UI/UX Designer',   avatar: avatarUrl('zara_khan') },
  { id: 'c4', name: 'Rishi Patel',    username: 'rishi_lens',     field: 'Photographer',     avatar: avatarUrl('rishi_patel') },
  { id: 'c5', name: 'Neha Gupta',     username: 'neha_brands',    field: 'Product Designer', avatar: avatarUrl('neha_gupta') },
  { id: 'c6', name: 'Aditya Verma',   username: 'dev.aditya',     field: 'Full-Stack Dev',   avatar: avatarUrl('aditya_verma') },
  { id: 'c7', name: 'Kavya Nair',     username: 'kavya_motion',   field: 'Motion Designer',  avatar: avatarUrl('kavya_nair') },
  { id: 'c8', name: 'Siddharth Roy',  username: 'sid.builds',     field: 'Indie Maker',      avatar: avatarUrl('siddharth_roy') },
  { id: 'c9', name: 'Ananya Mehta',   username: 'ananya.learns',  field: 'Data Scientist',   avatar: avatarUrl('ananya_mehta') },
];


// ─── Trending Reels (Right Sidebar) ──────────────────────────────────────────
export const TRENDING_REELS = [
  { id: 'r1', creator: CREATORS[0], thumbnail: 'https://picsum.photos/seed/reel-ai/200/320',    views: '12.4K', title: 'AI in 60 seconds' },
  { id: 'r2', creator: CREATORS[1], thumbnail: 'https://picsum.photos/seed/reel-web/200/320',   views: '8.1K',  title: 'CSS tricks' },
  { id: 'r3', creator: CREATORS[2], thumbnail: 'https://picsum.photos/seed/reel-ux/200/320',    views: '24.6K', title: 'Figma flow' },
  { id: 'r4', creator: CREATORS[3], thumbnail: 'https://picsum.photos/seed/reel-photo/200/320', views: '18.2K', title: 'Golden hour' },
];

// ─── Interest / domain tabs ───────────────────────────────────────────────────
// Re-uses CURIOSITY_DOMAINS from the onboarding module as the single source of
// truth. Labels are title-cased (e.g. "TECHNOLOGY" → "Technology").
const toTitleCase = (str) =>
  str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

export const DOMAIN_TABS = [
  'For You',
  'Following',
  ...CURIOSITY_DOMAINS.map(d => toTitleCase(d.label)),
];

// Keep INTEREST_TABS as an alias so any other import keeps working.
export const INTEREST_TABS = DOMAIN_TABS;

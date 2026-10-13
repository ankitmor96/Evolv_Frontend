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

// ─── Feed Posts ───────────────────────────────────────────────────────────────
// type: 'reel' → renders existing <video> player
// type: 'post' → renders <img> or text content
// The UI reads media.type ('video' | 'image') to pick the media element;
// post.type ('reel' | 'post') drives the badge label only.
export const FEED_POSTS = [
  // ── 1. REEL ──────────────────────────────────────────────────────────────
  {
    id: 'p1',
    type: 'reel',
    creator: CREATORS[0],
    category: 'Technology',
    tags: ['#AI', '#MachineLearning', '#Learning'],
    caption: '3 things I learned while building my first AI project from scratch. Thread 🧵👇',
    media: { type: 'video', src: '/example.mp4', poster: 'https://picsum.photos/seed/ai-reel/720/405', duration: '0:32' },
    likes: 1240,
    comments: 232,
    shares: 84,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '2h ago',
  },

  // ── 2. POST ──────────────────────────────────────────────────────────────
  {
    id: 'p2',
    type: 'post',
    creator: CREATORS[1],
    category: 'Technology',
    tags: ['#React', '#WebDev', '#JavaScript'],
    caption: 'How I improved my React app performance by 60% without rewriting a single component. The trick was hiding in plain sight — and it\'s not what you think.',
    media: { type: 'image', src: 'https://picsum.photos/seed/webdev-post/720/405' },
    likes: 876,
    comments: 145,
    shares: 61,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '4h ago',
  },

  // ── 3. POST ──────────────────────────────────────────────────────────────
  {
    id: 'p3',
    type: 'post',
    creator: CREATORS[2],
    category: 'Design & Creative',
    tags: ['#UXDesign', '#Figma', '#ProductThinking'],
    caption: 'My design process: from chaotic sketches to clean, user-tested interfaces. Here\'s how I break down every new design challenge into 5 manageable phases.',
    media: { type: 'image', src: 'https://picsum.photos/seed/ux-post/720/405' },
    likes: 2100,
    comments: 389,
    shares: 210,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '6h ago',
  },

  // ── 4. REEL ──────────────────────────────────────────────────────────────
  {
    id: 'p4',
    type: 'reel',
    creator: CREATORS[3],
    category: 'Media & Content',
    tags: ['#Photography', '#GoldenHour', '#Craft'],
    caption: 'Light is everything. Here\'s how I think about composition when I can\'t control the sun ☀️ — 60 seconds of real-shoot breakdown.',
    media: { type: 'video', src: '/ex-2.mp4', poster: 'https://picsum.photos/seed/photo-reel/720/405', duration: '1:04' },
    likes: 3400,
    comments: 512,
    shares: 317,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '1d ago',
  },

  // ── 5. POST ──────────────────────────────────────────────────────────────
  {
    id: 'p5',
    type: 'post',
    creator: CREATORS[4],
    category: 'Design & Creative',
    tags: ['#ProductDesign', '#BuildInPublic', '#Startup'],
    caption: 'Building a product people actually love: lessons from 6 months of user research, 3 failed prototypes, and 200+ interviews.',
    media: { type: 'image', src: 'https://picsum.photos/seed/product-post/720/405' },
    likes: 1560,
    comments: 278,
    shares: 129,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '2d ago',
  },

  // ── 6. REEL ──────────────────────────────────────────────────────────────
  {
    id: 'p6',
    type: 'reel',
    creator: CREATORS[5],
    category: 'Technology',
    tags: ['#FullStack', '#Node', '#SystemDesign'],
    caption: 'How I designed a system that handles 1M requests/min on a $50/month server. System design breakdown in 90 seconds ⚡',
    media: { type: 'video', src: '/ex-3.mp4', poster: 'https://picsum.photos/seed/fullstack-reel/720/405', duration: '1:28' },
    likes: 4820,
    comments: 641,
    shares: 402,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '2d ago',
  },

  // ── 7. POST ──────────────────────────────────────────────────────────────
  {
    id: 'p7',
    type: 'post',
    creator: CREATORS[8],
    category: 'Science & Research',
    tags: ['#DataScience', '#Python', '#MachineLearning'],
    caption: 'I analyzed 500K rows of Netflix viewing data. What I found about human attention spans and binge behavior might change how you build products.',
    media: { type: 'image', src: 'https://picsum.photos/seed/data-post/720/405' },
    likes: 2230,
    comments: 334,
    shares: 175,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '3d ago',
  },
  // ── 8. POST: GUITAR & MUSIC ──
  {
    id: 'p8',
    type: 'post',
    creator: CREATORS[0],
    category: 'Media & Content',
    tags: ['#Music', '#Guitar', '#CreativeProcess'],
    caption: 'Every great performance starts with hours of practice when nobody is watching. 🎸 What skill are you working on right now?',
    media: {
      type: 'image',
      src: '/pexels-0ldpikes-32147406.jpg'
    },
    likes: 986,
    comments: 124,
    shares: 47,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '5h ago',
  },

  // ── 9. POST: VIRTUAL REALITY ──
  {
    id: 'p9',
    type: 'post',
    creator: CREATORS[1],
    category: 'Technology',
    tags: ['#VirtualReality', '#VR', '#FutureTech'],
    caption: 'What if learning meant stepping inside the experience instead of just reading about it? VR is changing how we explore, learn, and create. 🥽',
    media: {
      type: 'image',
      src: '/pexels-darlene-alderson-4389462.jpg'
    },
    likes: 1840,
    comments: 216,
    shares: 98,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '7h ago',
  },

  // ── 10. POST: GUITAR COMMUNITY ──
  {
    id: 'p10',
    type: 'post',
    creator: CREATORS[2],
    category: 'Music & Arts',
    tags: ['#Guitar', '#MusicCommunity', '#Creativity'],
    caption: 'Different instruments, different sounds, one shared passion. 🎶 Creativity connects people in ways words sometimes cannot.',
    media: {
      type: 'image',
      src: '/pexels-fotoinformator-37362851.jpg'
    },
    likes: 1320,
    comments: 178,
    shares: 65,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '9h ago',
  },

  // ── 11. POST: AI & ROBOTICS ──
  {
    id: 'p11',
    type: 'post',
    creator: CREATORS[3],
    category: 'Technology',
    tags: ['#ArtificialIntelligence', '#Robotics', '#Innovation'],
    caption: 'AI is no longer just a concept on a screen. Intelligent machines are reshaping how we interact with technology. 🤖 What real-world AI application excites you most?',
    media: {
      type: 'image',
      src: '/pexels-tara-winstead-8386440.jpg'
    },
    likes: 2750,
    comments: 342,
    shares: 194,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '12h ago',
  },

  // ── 12. POST: HARDWARE & ENGINEERING ──
  {
    id: 'p12',
    type: 'post',
    creator: CREATORS[4],
    category: 'Technology',
    tags: ['#Hardware', '#Engineering', '#Electronics'],
    caption: 'Behind every powerful device is a world of carefully engineered components. 🔧 Understanding the hardware makes us better problem-solvers. Never stop exploring how things work.',
    media: {
      type: 'image',
      src: '/pexels-tima-miroshnichenko-6754846.jpg'
    },
    likes: 1670,
    comments: 203,
    shares: 86,
    saved: false,
    liked: false,
    followed: false,
    timestamp: '1d ago',
  },


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

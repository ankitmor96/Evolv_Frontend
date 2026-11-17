import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, ArrowRight, Sparkles, Code2, Mic,
  Brain, Palette, PenLine, TrendingUp, Target, Compass, Users, Route,
  Rocket, Globe, Lightbulb, Play, FileText, Heart, CheckCircle2, Home,
  BookOpen, Bell, User, CheckCheck
} from 'lucide-react';
import '../discover/DiscoverPage.css';
import { profileService } from '../../services/profileService';
import { discoverService } from '../../services/discoverService.js';
import { navigate } from '../../utils/navigate.js';
import { CURIOSITY_DOMAINS } from '../onboarding/onboardingData.js';
import { homePostService } from '../../services/homePostService.js';
import { X } from "lucide-react";
import { connectionService } from '../../services/connectionService.js';
import { authService } from '../../services/authService.js';
import { userSearchService } from '../../services/userSearchService.js';

/* ───────────────────────── STATIC CONTENT ───────────────────────── */
const NAV = [
  { id: 'home', label: 'Home', icon: Home, to: '/home' },
  { id: 'discover', label: 'Discover', icon: Compass, to: '/discover' },
  { id: 'learning', label: 'My Learning', icon: BookOpen, to: '/learning' },
  { id: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications' },
  { id: 'profile', label: 'Profile', icon: User, to: '/profile' },
];
// The 4 options under the search bar
const TABS = [
  { id: 'foryou', label: 'For You' },
  { id: 'skills', label: 'Skills' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'improve', label: 'Improve Myself' },
];

// Hero slider
const SLIDES = [
  {
    tag: "Today's question",
    title: 'Why do we procrastinate even when we know what matters?',
    text: 'Explore the psychology behind it and learn practical ways to overcome it.',
    query: 'procrastinat',
    tone: 'plum',
  },
  {
    tag: 'Skill spotlight',
    title: 'What does it take to explain an idea clearly?',
    text: 'See how people turn complicated topics into simple stories.',
    query: 'communication',
    tone: 'violet',
  },
  {
    tag: 'Curiosity pick',
    title: 'How do small daily habits shape who we become?',
    text: 'Learn how consistency beats motivation over time.',
    query: 'habit',
    tone: 'indigo',
  },
  {
    tag: 'Try this week',
    title: 'Can you learn something new in just 20 minutes a day?',
    text: 'Find short lessons and posts from people who did it.',
    query: 'time management',
    tone: 'magenta',
  },
];

// TODO: replace with real posts (homePostService). Keep the same fields.
const DEMO_POSTS = [
  { id: 1, title: 'How to write cleaner Python code', author: 'Alex Carter', duration: '5:12', tags: ['Python', 'Programming'], tone: 'plum' },
  { id: 2, title: '3 techniques to speak with confidence', author: 'Maya Singh', duration: '4:28', tags: ['Public Speaking', 'Communication'], tone: 'violet' },
  { id: 3, title: 'How your brain builds habits', author: 'Dr. Leah Kim', duration: '6:15', tags: ['Psychology', 'Habits'], tone: 'indigo' },
  { id: 4, title: 'Plan your week in 10 minutes', author: 'Ethan Moore', duration: '7:20', tags: ['Time Management', 'Productivity'], tone: 'magenta' },
  { id: 5, title: 'Tell a story that people remember', author: 'Priya Sharma', duration: '3:40', tags: ['Storytelling', 'Writing'], tone: 'violet' },
  { id: 6, title: 'Photography basics: light and framing', author: 'Daniel Park', duration: '5:55', tags: ['Photography', 'Design'], tone: 'plum' },
];

// TODO: replace with real people from your API.
const DEMO_PEOPLE = [
  { id: 1, name: 'Dr. Sarah Lin', role: 'Neuroscience • Psychology', bio: 'Sharing insights on the human mind and better habits.' },
  { id: 2, name: 'Daniel Park', role: 'AI • Product Design', bio: 'Exploring technology, creativity and the future of work.' },
  { id: 3, name: 'Priya Sharma', role: 'Communication • Leadership', bio: 'Helping you become a more confident, authentic speaker.' },
  { id: 4, name: 'Arjun Menon', role: 'Web Development', bio: 'Breaking down frontend and full-stack concepts simply.' },
];

const NEW_TOPICS = [
  { id: 1, icon: Rocket, title: 'Space Exploration', text: 'Discover the mysteries beyond our planet.', tone: 'indigo' },
  { id: 2, icon: Globe, title: 'Ancient Civilizations', text: 'Learn how societies rose and fell.', tone: 'plum' },
  { id: 3, icon: Brain, title: 'The Human Mind', text: 'Understand what makes us who we are.', tone: 'violet' },
  { id: 4, icon: Lightbulb, title: 'Creativity', text: 'Explore a new way of thinking.', tone: 'magenta' },
];

const JOURNEY = [
  { icon: Compass, text: "Follow topics you're curious about" },
  { icon: Sparkles, text: 'Explore new skills and questions' },
  { icon: Users, text: 'Connect with people who share knowledge' },
  { icon: Route, text: 'Track what you want to improve' },
];

/* ───────────────────────── HELPERS ───────────────────────── */

const ICON_RULES = [
  [/python|java|code|program|web|react|develop|sql|html|css/i, Code2],
  [/speak|communic|talk|present/i, Mic],
  [/psych|mind|think|brain|critical/i, Brain],
  [/design|ui|ux|art|photo/i, Palette],
  [/writ|story|content/i, PenLine],
  [/financ|money|invest|business/i, TrendingUp],
  [/focus|habit|time|consisten|product/i, Target],
];
const iconFor = (name = '') =>
  ICON_RULES.find(([re]) => re.test(name))?.[1] ?? Sparkles;

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function PersonAvatar({ src, name }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="dx-avatar big">{initials(name)}</span>;
  }

  return (
    <img
      src={src}
      alt={name}
      className="dx-avatar big dx-avatar-img"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const rowsOf = (r) => {
  if (r.status !== 'fulfilled') return [];
  const v = r.value;
  return Array.isArray(v) ? v : v?.data ?? v?.items ?? [];
};

const openPost = (post, list = []) => {
  const type = post.media?.type;
  const src = post.media?.src;
  if (!src) return;

  if (type === 'document') {
    window.open(src, '_blank', 'noopener');
    return;
  }

  // Only images/videos can be shown in the viewer
  const mediaList = list.filter(
    (p) => (p.media?.type === 'video' || p.media?.type === 'image') && p.media?.src
  );

  // 1) the list the user can scroll through
  sessionStorage.setItem('evolv-list-posts', JSON.stringify(mediaList));
  // 2) the post that must open FIRST
  sessionStorage.setItem('evolv-reel-start', String(post.id));
  // 3) where Back should return
  sessionStorage.setItem('evolv-reel-back', '/discover');

  // ReelsPage handles both images and videos with vertical scrolling
  navigate('/reels');
};

/* Username shown on the tile */
const usernameOf = (post) =>
  post.creator?.username || post.creator?.name || post.username || 'user';

/* Total reactions, whatever shape the API sends */
const reactionTotal = (post) => {
  const counts = post.reactions?.counts ?? post.reactionCounts ?? post.counts;
  if (counts && typeof counts === 'object') {
    return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }
  const direct =
    post.reactionCount ?? post.totalReactions ?? post.reactionsCount ?? post.likes;
  if (direct != null) return Number(direct) || 0;

  return (
    (Number(post.appreciations) || 0) +
    (Number(post.helpfulCount) || 0) +
    (Number(post.learnedCount) || 0)
  );
};

function PostTile({ post, onOpen }) {
  const type = post.media?.type;
  const src = post.media?.src;
  const username = usernameOf(post);

  // start with whatever the post already has, then fill from the API
  const [counts, setCounts] = useState({
    appreciate: Number(post.appreciations) || 0,
    helpful: Number(post.helpfulCount) || 0,
    learned: Number(post.learnedCount) || 0,
  });

  useEffect(() => {
    if (!/^\d+$/.test(String(post.id))) return undefined;
    let cancelled = false;

    homePostService.getReactions(post.id).then(({ counts: c = {} }) => {
      if (cancelled) return;
      setCounts((prev) => ({
        appreciate: c.APPRECIATE ?? prev.appreciate,
        helpful: c.HELPFUL ?? prev.helpful,
        learned: c.LEARNED ?? prev.learned,
      }));
    });

    return () => { cancelled = true; };
  }, [post.id]);

  return (
    <button
      type="button"
      className="dx-conn-tile"
      onClick={() => onOpen(post)}
      aria-label={`Open post by ${username}`}
    >
      {type === 'video' && src ? (
        <video
          src={`${src}#t=0.1`}
          poster={post.media?.poster || undefined}
          muted
          playsInline
          preload="metadata"
        />
      ) : type === 'image' && src ? (
        <img src={src} alt={post.caption || 'Post'} loading="lazy" />
      ) : (
        <div className="dx-conn-fallback">
          <FileText size={26} />
          <span>{(post.caption || 'Post').slice(0, 40)}</span>
        </div>
      )}

      {/* top-left: 3 reactions */}
      <span className="dx-conn-reactions">
        <span className="dx-conn-react pink" title="Appreciate">
          <Heart size={13} fill="currentColor" />
          {counts.appreciate}
        </span>
        <span className="dx-conn-react blue" title="Helpful">
          <Sparkles size={13} />
          {counts.helpful}
        </span>
        <span className="dx-conn-react green" title="Learned">
          <CheckCircle2 size={13} />
          {counts.learned}
        </span>
      </span>

      {type === 'video' && (
        <span className="dx-conn-badge"><Play size={12} fill="currentColor" /></span>
      )}

      <span className="dx-conn-user">@{username}</span>
    </button>
  );
}


/* ───────────────────────── COMPONENT ───────────────────────── */

export default function DiscoverPage() {
  const [tab, setTab] = useState('foryou');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');

  // slider
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // user data
  const [curiosity, setCuriosity] = useState([]);
  const [skills, setSkills] = useState([]);
  const [improve, setImprove] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // userId(string) -> { status: 'none'|'pending'|'incoming'|'connected', connectionId }
  const [connMap, setConnMap] = useState(() => new Map());
  const pendingConnect = useRef(new Set()); const postsRef = useRef(null);

  // connections explore
  const [connMode, setConnMode] = useState(false);
  const [connPosts, setConnPosts] = useState([]);
  const [connMeta, setConnMeta] = useState({
    message: '', totalConnections: 0, totalPosts: 0, hasMore: false, nextCursor: null,
  });
  const [connLoading, setConnLoading] = useState(false);
  const [connError, setConnError] = useState('');
  // skill explore
  const [skillIds, setSkillIds] = useState({});
  const [skillMode, setSkillMode] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillPosts, setSkillPosts] = useState([]);
  const [skillMeta, setSkillMeta] = useState({ message: '', totalPosts: 0, hasMore: false, nextCursor: null });
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillError, setSkillError] = useState('');
  const [skillCounts, setSkillCounts] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [curiosityLoading, setCuriosityLoading] = useState(true);

  // the clicked curiosity + its posts
  const [activeCur, setActiveCur] = useState(null);
  const [curPosts, setCurPosts] = useState([]);
  const [curPostsLoading, setCurPostsLoading] = useState(false);
  const [curError, setCurError] = useState("");
  const [curCursor, setCurCursor] = useState(null);
  const [curHasMore, setCurHasMore] = useState(false);

  const curReq = useRef(0);
  const curPanelRef = useRef(null);
  const curiosityNames = useMemo(() => curiosity.map((c) => c.name), [curiosity]);

  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [peopleError, setPeopleError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const q = search.trim();

    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const found = await userSearchService.searchUsers(q);
        if (cancelled) return;
        setSearchResults(found);
        setSearchError('');
      } catch (err) {
        if (cancelled) return;
        console.error('[Discover] Search failed:', err);
        setSearchResults([]);
        setSearchError('Could not search right now. Please try again.');
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);
  useEffect(() => {
    const onDocClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPeopleLoading(true);
      setPeopleError('');
      try {
        const list = await discoverService.getUserSuggestions();
        if (!cancelled) setPeople(list);
      } catch (err) {
        console.error('[Discover] Failed to load user suggestions:', err);
        if (!cancelled) {
          setPeople([]);
          setPeopleError('Could not load suggestions right now.');
        }
      } finally {
        if (!cancelled) setPeopleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // 1) Bind GET /api/skills/curiosity
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [res, idToName] = await Promise.all([
          profileService.getUserCuriosity(),
          profileService.fetchSkillIdToNameMap(),
        ]);
        const rows = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];

        const seen = new Set();
        const list = [];
        rows.forEach((r) => {
          const id = Number(r.skillId);
          const name = idToName[id];
          if (name && !seen.has(id)) {
            seen.add(id);
            list.push({ id, name });
          }
        });

        if (alive) setCuriosity(list);
      } catch (err) {
        console.error("[Discover] curiosity load failed:", err);
      } finally {
        if (alive) setCuriosityLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const openUserProfile = (userId) => {
    if (userId == null) return;
    navigate(`/profile/${userId}`);
    window.dispatchEvent(new Event('navigated'));
  };

  const handleSelectPerson = (person) => {
    setSearchOpen(false);
    setSearch('');
    openUserProfile(person.id);
  };

  // 2) Fetch posts of one curiosity skill
  const fetchCurPosts = async (skill, cursor = null) => {
    const reqId = ++curReq.current;
    setCurPostsLoading(true);
    setCurError("");
    try {
      const res = await discoverService.getSkillPosts({ skillId: skill.id, cursor });
      if (reqId !== curReq.current) return;
      setCurPosts((prev) => (cursor ? [...prev, ...res.posts] : res.posts));
      setCurCursor(res.nextCursor);
      setCurHasMore(res.hasMore);
    } catch (err) {
      if (reqId !== curReq.current) return;
      setCurError(err.message || "Could not load posts.");
    } finally {
      if (reqId === curReq.current) setCurPostsLoading(false);
    }
  };

  // 3) Click handler (click same card again = close)
  const openCuriosity = (skill) => {
    if (activeCur?.id === skill.id) {
      closeCuriosity();
      return;
    }
    setActiveCur(skill);
    setCurPosts([]);
    setCurCursor(null);
    setCurHasMore(false);
    fetchCurPosts(skill);
    setTimeout(() => {
      curPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  const closeCuriosity = () => {
    curReq.current++;
    setActiveCur(null);
    setCurPosts([]);
    setCurError("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* auto-advance slider */
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  /* load the user's curiosity / skills / improve lists */
  /* load the user's skills / improve lists + skill map */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [skillRes, idToName] = await Promise.allSettled([
          profileService.getUserSkills(),
          profileService.fetchSkillIdToNameMap(),
        ]);
        if (cancelled) return;

        const map = idToName.status === 'fulfilled' ? idToName.value || {} : {};
        const unique = (arr) => [...new Set(arr.filter(Boolean))];
        const nameOf = (row) => map[Number(row.skillId)];
        const userRows = rowsOf(skillRes);

        setSkills(
          unique(
            userRows
              .filter((r) => r.relationshipType === 'CAN_DO' || r.relationshipType === 'LEARNING')
              .map(nameOf)
          )
        );
        setImprove(
          unique(userRows.filter((r) => r.relationshipType === 'WANT_TO_IMPROVE').map(nameOf))
        );
        setAllSkills(unique(Object.values(map)));
        setSkillIds(
          Object.fromEntries(
            Object.entries(map).map(([id, name]) => [String(name).trim().toLowerCase(), Number(id)])
          )
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /* terms that the selected tab is "about" */
  const tabTerms = useMemo(() => {
    if (tab === 'skills') return skills;
    if (tab === 'curiosity') return curiosityNames;
    if (tab === 'improve') return improve;
    return [...new Set([...skills, ...curiosityNames, ...improve])];
  }, [tab, skills, curiosityNames, improve]);

  /* skills the user does not have yet → "worth exploring" */
  const suggestions = useMemo(() => {
    const mine = new Set(
      [...skills, ...curiosityNames, ...improve].map((s) => String(s).toLowerCase())
    );
    return allSkills.filter((s) => !mine.has(String(s).toLowerCase())).slice(0, 14);
  }, [allSkills, skills, curiosityNames, improve]);

  /* "Based on what you want to improve" cards */
  /* "Based on what you want to improve" cards:
     1) skills the user wants to improve (WANT_TO_IMPROVE)
     2) then the user's curiosity skills
     3) if both are empty, fall back to suggestions */
  const personalCards = [...new Set([...improve, ...curiosityNames])];
  const improveCards = (personalCards.length ? personalCards : suggestions).slice(0, 8);

  /* chips row changes with the tab */
  const chipTitle =
    tab === 'foryou' ? 'Skills worth exploring'
      : tab === 'skills' ? 'Your skills'
        : tab === 'curiosity' ? 'Things you are curious about'
          : 'What you want to improve';
  const chipItems = tab === 'foryou' ? suggestions : tabTerms;

  /* posts */
  const posts = useMemo(() => {
    return DEMO_POSTS.filter((p) => {
      const hay = [p.title, p.author, ...p.tags].join(' ').toLowerCase();
      const byTab =
        tab === 'foryou' || tabTerms.length === 0
          ? true
          : tabTerms.some((t) => hay.includes(t.toLowerCase()));
      const byTopic = !topic || hay.includes(topic.toLowerCase());
      return byTab && byTopic;
    });
  }, [tab, tabTerms, topic]);

  const goToPosts = () =>
    postsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const loadConnPosts = async (cursor = null) => {
    setConnLoading(true);
    setConnError('');
    try {
      const res = await discoverService.getConnectionPosts({ limit: 12, cursor });
      setConnPosts((prev) => (cursor ? [...prev, ...res.posts] : res.posts));
      setConnMeta({
        message: res.message,
        totalConnections: res.totalConnections,
        totalPosts: res.totalPosts,
        hasMore: res.hasMore,
        nextCursor: res.nextCursor,
      });
    } catch (err) {
      setConnError(err.message || 'Could not load connection posts.');
    } finally {
      setConnLoading(false);
    }
  };

  const openConnections = () => {
    if (connMode) { setConnMode(false); return; }
    setConnMode(true);
    setSkillMode(false);
    setTopic('');
    loadConnPosts(null);
    setTimeout(goToPosts, 50);
  };

  const loadSkillPosts = async (name, cursor = null) => {
    const id = skillIds[String(name).trim().toLowerCase()];
    if (id == null) {
      setSkillError(`Could not find an ID for "${name}".`);
      return;
    }
    setSkillLoading(true);
    setSkillError('');
    try {
      const res = await discoverService.getSkillPosts({ skillId: id, limit: 12, cursor });
      setSkillPosts((prev) => (cursor ? [...prev, ...res.posts] : res.posts));
      setSkillMeta({
        message: res.message,
        totalPosts: res.totalPosts,
        hasMore: res.hasMore,
        nextCursor: res.nextCursor,
      });
    } catch (err) {
      setSkillError(err.message || 'Could not load skill posts.');
    } finally {
      setSkillLoading(false);
    }
  };

  const openSkills = () => {
    if (skillMode) { setSkillMode(false); return; }
    setSkillMode(true);
    setConnMode(false);
    setTopic('');
    loadSkillCounts();
    setTimeout(goToPosts, 50);
  };

  useEffect(() => {
    loadSkillCounts();
  }, []);

  const loadSkillCounts = async () => {
    try {
      const rows = await discoverService.getSkillCounts();
      const byId = {};
      rows.forEach((r) => { byId[r.skillId] = Number(r.postCount) || 0; });
      setSkillCounts(byId);
    } catch (err) {
      console.warn('[Discover] could not load skill counts:', err.message);
      // the dropdown still works without counts
    }
  };

  const selectSkill = (name) => {
    setSelectedSkill(name);
    setSkillPosts([]);
    loadSkillPosts(name, null);
  };

  const pickTopic = (name) => {
    setConnMode(false);
    setSkillMode(false);
    setTopic((cur) => (cur === name ? '' : name));
    goToPosts();
  };

  const handleConnect = async (userId) => {
    const key = String(userId);
    if (pendingConnect.current.has(key)) return;
    pendingConnect.current.add(key);

    const me = authService.getCurrentUser();
    const myId = me?.id ?? me?.userId ?? me?._id ?? null;

    const current = connMap.get(key) ?? { status: 'none', connectionId: null };
    const setEntry = (entry) =>
      setConnMap((prev) => {
        const next = new Map(prev);
        if (entry) next.set(key, entry); else next.delete(key);
        return next;
      });

    // Re-read the server state (used when we are missing a connectionId)
    const syncFromServer = async () => {
      const map = await connectionService.getConnectionMap(myId);
      setConnMap(map);
      return map.get(key);
    };

    try {
      if (current.status === 'none') {
        // Send request
        setEntry({ status: 'pending', connectionId: null });
        try {
          const res = await connectionService.sendConnectionRequest(userId);
          const newId = res?.data?.id ?? res?.id ?? res?.connectionId ?? null;
          if (newId != null) setEntry({ status: 'pending', connectionId: newId });
          else await syncFromServer();
        } catch (err) {
          if (err.status === 409) { await syncFromServer(); return; }
          throw err;
        }

      } else if (current.status === 'incoming') {
        // Accept their request
        let id = current.connectionId;
        if (id == null) id = (await syncFromServer())?.connectionId;
        if (id == null) throw new Error('Connection record not found.');
        setEntry({ status: 'connected', connectionId: id });
        await connectionService.acceptConnectionRequest(id);

      } else {
        // Cancel pending request / remove connection
        if (current.status === 'connected' &&
          !window.confirm('Remove this person from your connections?')) {
          return;
        }
        let id = current.connectionId;
        if (id == null) id = (await syncFromServer())?.connectionId;
        if (id == null) throw new Error('Connection record not found.');
        setEntry(null);
        await connectionService.removeConnection(id);
      }
    } catch (err) {
      console.warn('[Discover] Connection action failed, rolling back:', err.message);
      setEntry(current.status === 'none' ? null : current);
    } finally {
      pendingConnect.current.delete(key);
    }
  };

  const prevSlide = () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  const nextSlide = () => setSlide((s) => (s + 1) % SLIDES.length);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = authService.getCurrentUser();
      const myId = me?.id ?? me?.userId ?? me?._id ?? null;
      const map = await connectionService.getConnectionMap(myId);
      if (!cancelled) setConnMap(map);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dx-layout">
      {/* ───── Sidebar (desktop / tablet) ───── */}
      <aside className="dx-sidebar" aria-label="Main navigation">
        <img src="/logo-remove.png" alt="EVOLV" className="dx-logo" />
        <nav>
          {NAV.map(({ id, label, icon: Icon, to }) => (
            <button
              key={id}
              type="button"
              className={`dx-nav-item ${id === 'discover' ? 'active' : ''}`}
              aria-current={id === 'discover' ? 'page' : undefined}
              onClick={() => navigate(to)}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="discover-page">
        {/* ───── Header ───── */}
        <header className="dx-header">
          <h1>Discover</h1>
          <p>Explore what makes you curious. Learn new skills. Become a better you.</p>
        </header>

        {/* ───── Search ───── */}
        <div className="dx-search-wrap" ref={searchBoxRef}>
          <div className="dx-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search people..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectPerson(searchResults[0]);
                }
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              aria-label="Search people"
              aria-expanded={searchOpen}
              autoComplete="off"
            />
            {search && (
              <button type="button" className="dx-clear" onClick={() => { setSearch(''); setSearchOpen(false); }}>
                Clear
              </button>
            )}
          </div>

          {searchOpen && search.trim().length >= 2 && (
            <div className="dx-search-dropdown" role="listbox" aria-label="Search results">
              {searchLoading && <p className="dx-search-status">Searching...</p>}

              {!searchLoading && searchError && (
                <p className="dx-search-status error">{searchError}</p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className="dx-search-status">No people found for "{search.trim()}".</p>
              )}

              {!searchLoading && searchResults.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  role="option"
                  className="dx-search-result"
                  onClick={() => handleSelectPerson(person)}
                >
                  <PersonAvatar src={person.avatar} name={person.name} />
                  <span className="dx-search-result-info">
                    <strong>{person.name}</strong>
                    <small>{person.username ? `@${person.username}` : person.field}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ───── 4 options ───── */}
        {/* <div className="dx-tabs" role="tablist" aria-label="Discover sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`dx-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => { setTab(t.id); setTopic(''); setConnMode(false); setSkillMode(false); }}
          >
            {t.label}
          </button>
        ))}
      </div> */}

        {/* ───── Hero slider ───── */}
        <section
          className="dx-hero"
          aria-roledescription="carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* <div className="dx-hero-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <div
              key={s.title}
              className={`dx-slide tone-${s.tone}`}
              aria-hidden={slide !== i}
            >
              <div className="dx-slide-body">
                <span className="dx-slide-tag">{s.tag}</span>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <button
                  type="button"
                  className="dx-slide-btn"
                  onClick={() => { setSearch(s.query); goToPosts(); }}
                >
                  Explore this question
                  <ArrowRight size={16} />
                </button>
              </div>
              <Compass className="dx-slide-art" size={210} strokeWidth={1} aria-hidden="true" />
            </div>
          ))}
        </div> */}

          <button type="button" className="dx-arrow left" onClick={prevSlide} aria-label="Previous slide">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="dx-arrow right" onClick={nextSlide} aria-label="Next slide">
            <ChevronRight size={18} />
          </button>

          <div className="dx-dots">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={i === slide ? 'active' : ''}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* <h2>{personalCards.length ? 'Based on what you want to improve' : 'A good place to start with curiosity'}</h2> */}

        {/* ───── Your curiosities ───── */}
        <section className="dx-section">
          <div className="dx-section-head">
            <div>
              <h2>Your curiosities</h2>
              <p className="dx-muted">Tap a topic to see posts about it right here.</p>
            </div>
            {curiosity.length > 0 && (
              <span className="dx-cur-total">{curiosity.length} topics</span>
            )}
          </div>

          {curiosityLoading ? (
            <div className="dx-cur-row">
              {[0, 1, 2, 3].map((n) => <div key={n} className="dx-cur-skeleton" />)}
            </div>
          ) : curiosity.length === 0 ? (
            <p className="dx-muted">Add curiosity skills to your profile to see them here.</p>
          ) : (
            <div className="dx-scroll dx-cur-row">
              {curiosity.map((skill, i) => {
                const Icon = iconFor(skill.name);
                const count = skillCounts[skill.id] ?? 0;
                const active = activeCur != null && activeCur.id === skill.id;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    aria-pressed={active}
                    className={`dx-cur-card tone-${SLIDES[i % SLIDES.length].tone} ${active ? "active" : ""}`}
                    onClick={() => openCuriosity(skill)}
                  >
                    <span className="dx-cur-icon"><Icon size={20} /></span>
                    <span className="dx-cur-info">
                      <strong>{skill.name}</strong>
                      <small>{count} {count === 1 ? "post" : "posts"}</small>
                    </span>
                    <span className="dx-cur-arrow"><ArrowRight size={15} /></span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Posts open right under the cards */}
          {activeCur && (
            <div className="dx-cur-panel" ref={curPanelRef}>
              <div className="dx-cur-panel-head">
                <h3>Posts on {activeCur.name}</h3>
                <button type="button" className="dx-cur-close" onClick={closeCuriosity} aria-label="Close posts">
                  <X size={16} /> Close
                </button>
              </div>

              {curError ? (
                <p className="dx-muted">{curError}</p>
              ) : curPostsLoading && curPosts.length === 0 ? (
                <p className="dx-muted">Loading posts…</p>
              ) : curPosts.length === 0 ? (
                <div className="dx-empty">
                  <h3>No posts yet</h3>
                  <p>Nobody has posted about {activeCur.name} yet.</p>
                </div>
              ) : (
                <>
                  <div className="dx-conn-grid">
                    {curPosts.map((post) => (

                      <PostTile key={post.id} post={post} onOpen={(p) => openPost(p, curPosts)} />))}
                  </div>

                  {curHasMore && (
                    <button
                      type="button"
                      className="dx-cur-more"
                      disabled={curPostsLoading}
                      onClick={() => fetchCurPosts(activeCur, curCursor)}
                    >
                      {curPostsLoading ? "Loading…" : "Load more"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* ───── Skills / curiosity chips (with Connections box first) ───── */}
        <section className="dx-section">
          <div className="dx-section-head">
            <h2>{chipTitle}</h2>
          </div>

          {loading ? (
            <p className="dx-muted">Loading your curiosities...</p>
          ) : improveCards.length === 0 ? (
            <p className="dx-muted">Add skills to your profile to get personal picks here.</p>
          ) : (
            <div className="dx-scroll dx-skill-row">
              <button
                type="button"
                className={`dx-skill ${connMode ? 'active' : ''}`}
                onClick={openConnections}
                aria-pressed={connMode}
              >
                <span className="dx-skill-icon"><Users size={22} /></span>
                Connections
              </button>
              <button
                type="button"
                className={`dx-skill ${skillMode ? 'active' : ''}`}
                onClick={openSkills}
                aria-pressed={skillMode}
              >
                <span className="dx-skill-icon"><Sparkles size={22} /></span>
                Skills
              </button>

            </div>
          )}
        </section>
        {skillMode && (
          <section className="dx-section" ref={postsRef}>
            <div className="dx-section-head">
              <h2>{selectedSkill ? `${selectedSkill} posts` : 'Choose a skill'}</h2>
              <button type="button" className="dx-link" onClick={() => setSkillMode(false)}>Close</button>
            </div>

            <div className="dx-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="dx-dd-trigger"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-label="Choose a skill"
              >
                <span className={selectedSkill ? "" : "dx-dd-placeholder"}>
                  {selectedSkill || "Select a skill…"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="dx-dd-menu" role="listbox">
                  <div className="dx-dd-colhead">
                    <span>Skill</span>
                    <span>Post count</span>
                  </div>

                  {CURIOSITY_DOMAINS.map((domain) => (
                    <div key={domain.id} className="dx-dd-group">
                      <div className="dx-dd-group-label">{domain.label}</div>

                      {[...new Set(domain.skills)].map((name) => {
                        const id = skillIds[String(name).trim().toLowerCase()];
                        const count = skillCounts[id] ?? 0;
                        return (
                          <button
                            type="button"
                            key={name}
                            role="option"
                            aria-selected={selectedSkill === name}
                            className={`dx-dd-option ${selectedSkill === name ? "active" : ""}`}
                            onClick={() => {
                              selectSkill(name);
                              setDropdownOpen(false);
                            }}
                          >
                            <span>{name}</span>
                            <span className="dx-dd-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedSkill && (
              <div style={{ marginTop: 20 }}>
                {skillError ? (
                  <p className="dx-muted" role="alert">{skillError}</p>
                ) : skillLoading && skillPosts.length === 0 ? (
                  <p className="dx-muted">Loading posts...</p>
                ) : skillPosts.length === 0 ? (
                  <div className="dx-empty">
                    <Search size={28} />
                    <h3>No Post Yet</h3>
                    <p>{skillMeta.message || `No posts for ${selectedSkill} yet.`}</p>
                  </div>
                ) : (
                  <>
                    <div className="dx-conn-grid">
                      {skillPosts.map((post) => (
                        <PostTile key={post.id} post={post} onOpen={(p) => openPost(p, skillPosts)} />
                      ))}
                    </div>
                    {skillMeta.hasMore && (
                      <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <button type="button" className="dx-slide-btn"
                          onClick={() => loadSkillPosts(selectedSkill, skillMeta.nextCursor)}
                          disabled={skillLoading}>
                          {skillLoading ? 'Loading...' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* ───── Connections posts OR Popular posts ───── */}
        {connMode ? (
          <section className="dx-section" ref={postsRef}>
            <div className="dx-section-head">
              <h2>Posts from your connections</h2>
              <button type="button" className="dx-link" onClick={() => setConnMode(false)}>
                Close
              </button>
            </div>

            {connError ? (
              <p className="dx-muted" role="alert">{connError}</p>
            ) : connLoading && connPosts.length === 0 ? (
              <p className="dx-muted">Loading posts...</p>
            ) : connPosts.length === 0 ? (
              <div className="dx-empty">
                <Users size={28} />
                <h3>No connection yet</h3>
                <p>{connMeta.message || 'Connect with people to see their posts here.'}</p>
              </div>
            ) : (
              <>
                <div className="dx-conn-grid">
                  {connPosts.map((post) => (
                    <PostTile key={post.id} post={post} onOpen={(p) => openPost(p, connPosts)} />
                  ))}
                </div>

                {connMeta.hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button
                      type="button"
                      className="dx-slide-btn"
                      onClick={() => loadConnPosts(connMeta.nextCursor)}
                      disabled={connLoading}
                    >
                      {connLoading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        ) : skillMode ? null : (
          <section className="dx-section" ref={postsRef}>
            {/* <div className="dx-section-head">
            <h2>{topic ? topic : 'Popular in your interests'}</h2>
            {(topic || search) && (
              <button
                type="button"
                className="dx-link"
                onClick={() => { setTopic(''); setSearch(''); }}
              >
                Clear filters
              </button>
            )}
          </div> */}

            {posts.length === 0 ? (
              <div className="dx-empty">
                <Search size={28} />
                <h3>No posts found</h3>
                <p>Try another topic or search term.</p>
              </div>
            ) : (
              <div className="dx-scroll dx-posts">
                {/* {PEOPLE.map((p) => (
                <article key={p.id} className="dx-post">
                  <div className={`dx-thumb tone-${p.tone}`}>
                    <Play size={26} />
                    <span className="dx-duration">{p.duration}</span>
                  </div>

                  <h3>{p.title}</h3>

                  <div className="dx-author">
                    <span className="dx-avatar">{initials(p.author)}</span>
                    {p.author}
                  </div>

                  <div className="dx-tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </article>
              ))} */}
              </div>
            )}
          </section>
        )}

        {/* ───── People ───── */}
        <section className="dx-section">
          <div className="dx-section-head">
            <h2>People you could learn from</h2>
          </div>

          {peopleLoading ? (
            <p className="dx-note">Loading suggestions...</p>
          ) : peopleError ? (
            <p className="dx-note error">{peopleError}</p>
          ) : people.length === 0 ? (
            <p className="dx-note">No suggestions yet. Check back soon.</p>
          ) : (
            <div className="dx-scroll dx-people">
              {people.map((p, index) => (
                <div key={p.id} className="dx-person">
                  <div className="dx-person-top">
                    <PersonAvatar src={p.avatar} name={p.name} />
                    <div>
                      <strong>{p.hasUsername ? `@${p.name}` : p.name}</strong>
                      <span>
                        {p.identities.length > 0 ? p.identities.join(' • ') : p.role}
                      </span>
                    </div>
                    {index < 3 && <span className="dx-rank">#{index + 1}</span>}
                  </div>

                  <p className="dx-person-meta">
                    {p.postCount} post{p.postCount === 1 ? '' : 's'} · {p.total} reaction
                    {p.total === 1 ? '' : 's'}
                  </p>

                  <div className="dx-person-stats">
                    <span
                      className="dx-stat appreciate"
                      data-tip="Appreciated"
                      tabIndex={0}
                      aria-label={`${p.appreciate} appreciations`}
                    >
                      <Heart size={13} aria-hidden="true" /> {p.appreciate}
                    </span>

                    <span
                      className="dx-stat helpful"
                      data-tip="Helpful"
                      tabIndex={0}
                      aria-label={`${p.helpful} found helpful`}
                    >
                      <Sparkles size={13} aria-hidden="true" /> {p.helpful}
                    </span>

                    <span
                      className="dx-stat learned"
                      data-tip="Learned"
                      tabIndex={0}
                      aria-label={`${p.learned} learned`}
                    >
                      <CheckCircle2 size={13} aria-hidden="true" /> {p.learned}
                    </span>
                  </div>

                  <div className="dx-person-actions">
                    <button
                      type="button"
                      className="dx-view-profile"
                      onClick={() => openUserProfile(p.id)}
                    >
                      View Profile
                    </button>

                    {(() => {
                      const status = connMap.get(String(p.id))?.status ?? 'none';
                      const config = {
                        none: { label: 'Connect', cls: '', aria: `Connect with ${p.name}` },
                        pending: { label: 'Requested', cls: 'on', aria: `Cancel request to ${p.name}` },
                        incoming: { label: 'Accept', cls: '', aria: `Accept request from ${p.name}` },
                        connected: { label: 'Connected', cls: 'on', aria: `Disconnect from ${p.name}` },
                      }[status];

                      return (
                        <button
                          type="button"
                          className={`dx-follow ${config.cls}`}
                          onClick={() => handleConnect(p.id)}
                          aria-label={config.aria}
                        >
                          {status === 'connected' && <CheckCheck size={14} aria-hidden="true" />}
                          {config.label}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ───── Explore something new ───── */}
        {/* <section className="dx-section">
        <div className="dx-section-head">
          <h2>Explore something new</h2>
        </div>

        <div className="dx-scroll dx-new">
          {NEW_TOPICS.map(({ id, icon: Icon, title, text, tone }) => (
            <button
              key={id}
              type="button"
              className={`dx-new-card tone-${tone}`}
              onClick={() => { setSearch(title); goToPosts(); }}
            >
              <Icon size={22} />
              <strong>{title}</strong>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </section> */}

        {/* ───── Discovery journey ───── */}
        <section className="dx-journey">
          <h2>Your Discovery Journey</h2>
          <p>The more you explore, the better we can recommend for you.</p>
          <div className="dx-journey-grid">
            {JOURNEY.map(({ icon: Icon, text }) => (
              <div key={text} className="dx-journey-item">
                <span className="dx-journey-icon"><Icon size={20} /></span>
                {text}
              </div>
            ))}
          </div>
        </section>


      </div>
    </div>
  );
}

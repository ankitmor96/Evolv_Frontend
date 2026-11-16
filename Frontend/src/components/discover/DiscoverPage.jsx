import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, ArrowRight, Sparkles, Code2, Mic,
  Brain, Palette, PenLine, TrendingUp, Target, Compass, Users, Route,
  Rocket, Globe, Lightbulb, Play, FileText, Heart, CheckCircle2, Home,
  BookOpen, Bell, User
} from 'lucide-react';
import '../discover/DiscoverPage.css';
import { profileService } from '../../services/profileService';
import { discoverService } from '../../services/discoverService.js';
import { navigate } from '../../utils/navigate.js';
import { CURIOSITY_DOMAINS } from '../onboarding/onboardingData.js';
import { homePostService } from '../../services/homePostService.js';

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
  { icon: Compass, text: "Follow topics you're interested in" },
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

  const [following, setFollowing] = useState(() => new Set());
  const postsRef = useRef(null);

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

  /* auto-advance slider */
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  /* load the user's curiosity / skills / improve lists */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [curRes, skillRes, idToName] = await Promise.allSettled([
          profileService.getUserCuriosity(),
          profileService.getUserSkills(),
          profileService.fetchSkillIdToNameMap(),
        ]);
        if (cancelled) return;

        const map = idToName.status === 'fulfilled' ? idToName.value || {} : {};
        const unique = (arr) => [...new Set(arr.filter(Boolean))];
        const nameOf = (row) => map[Number(row.skillId)];

        const userRows = rowsOf(skillRes);

        setCuriosity(unique(rowsOf(curRes).map(nameOf)));
        setSkills(
          unique(
            userRows
              .filter((r) => r.relationshipType === 'CAN_DO' || r.relationshipType === 'LEARNING')
              .map(nameOf)
          )
        );
        setImprove(
          unique(
            userRows.filter((r) => r.relationshipType === 'WANT_TO_IMPROVE').map(nameOf)
          )
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
    if (tab === 'curiosity') return curiosity;
    if (tab === 'improve') return improve;
    return [...new Set([...skills, ...curiosity, ...improve])];
  }, [tab, skills, curiosity, improve]);

  /* skills the user does not have yet → "worth exploring" */
  const suggestions = useMemo(() => {
    const mine = new Set([...skills, ...curiosity, ...improve].map((s) => s.toLowerCase()));
    return allSkills.filter((s) => !mine.has(s.toLowerCase())).slice(0, 14);
  }, [allSkills, skills, curiosity, improve]);

  /* "Based on what you want to improve" cards */
  /* "Based on what you want to improve" cards:
     1) skills the user wants to improve (WANT_TO_IMPROVE)
     2) then the user's curiosity skills
     3) if both are empty, fall back to suggestions */
  const personalCards = [...new Set([...improve, ...curiosity])];
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
    const q = search.trim().toLowerCase();
    return DEMO_POSTS.filter((p) => {
      const hay = [p.title, p.author, ...p.tags].join(' ').toLowerCase();
      const byTab =
        tab === 'foryou' || tabTerms.length === 0
          ? true
          : tabTerms.some((t) => hay.includes(t.toLowerCase()));
      const byTopic = !topic || hay.includes(topic.toLowerCase());
      const bySearch = !q || hay.includes(q);
      return byTab && byTopic && bySearch;
    });
  }, [tab, tabTerms, topic, search]);

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

  const toggleFollow = (id) =>
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const prevSlide = () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  const nextSlide = () => setSlide((s) => (s + 1) % SLIDES.length);

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
          <p>Explore what interests you. Learn new skills. Become a better you.</p>
        </header>

        {/* ───── Search ───── */}
        <div className="dx-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search skills, topics, questions, or people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="dx-clear" onClick={() => setSearch('')}>
              Clear
            </button>
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

        {/* ───── Based on what you want to improve ───── */}
        <section className="dx-section">
          <div className="dx-section-head">
            <h2>{personalCards.length ? 'Based on what you want to improve' : 'A good place to start with curiosity'}</h2>        </div>

          {loading ? (
            <p className="dx-muted">Loading your interests...</p>
          ) : improveCards.length === 0 ? (
            <p className="dx-muted">Add skills to your profile to get personal picks here.</p>
          ) : (
            <div className="dx-scroll dx-improve">
              {improveCards.map((name, i) => {
                const Icon = iconFor(name);

                return (
                  <button
                    key={name}
                    type="button"
                    className={`dx-improve-card tone-${SLIDES[i % SLIDES.length].tone}`}
                    onClick={() => pickTopic(name)}
                  >
                    <span className="dx-icon-box">
                      <Icon size={22} />
                    </span>

                    <strong>{name}</strong>

                    <span className="dx-improve-text">
                      See posts and questions about {name.toLowerCase()}.
                    </span>

                    <span className="dx-improve-go">
                      <ArrowRight size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ───── Skills / curiosity chips (with Connections box first) ───── */}
        <section className="dx-section">
          <div className="dx-section-head">
            <h2>{chipTitle}</h2>
          </div>

          {loading ? (
            <p className="dx-muted">Loading your interests...</p>
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

            <div className="dx-dropdown">
              <select
                value={selectedSkill}
                onChange={(e) => e.target.value && selectSkill(e.target.value)}
                aria-label="Choose a skill"
              >
                <option value="" disabled>Select a skill…</option>
                {CURIOSITY_DOMAINS.map((domain) => (
                  <optgroup key={domain.id} label={domain.label}>
                    {[...new Set(domain.skills)].map((name) => {
                      const id = skillIds[String(name).trim().toLowerCase()];
                      const count = skillCounts[id];
                      return (
                        <option key={name} value={name}>
                          {count != null ? `${name} (${count})` : name}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
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

          <div className="dx-scroll dx-people">
            {DEMO_PEOPLE.map((p) => (
              <div key={p.id} className="dx-person">
                <div className="dx-person-top">
                  <span className="dx-avatar big">{initials(p.name)}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <span>{p.role}</span>
                  </div>
                </div>
                <p>{p.bio}</p>
                <button
                  type="button"
                  className={`dx-follow ${following.has(p.id) ? 'on' : ''}`}
                  onClick={() => toggleFollow(p.id)}
                >
                  {following.has(p.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
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

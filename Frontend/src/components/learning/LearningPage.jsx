import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Home, Compass, BookOpen, PlusCircle, Bell, User, Search,
  FileText, Image as ImageIcon, Video, Type, Lightbulb, CheckCircle2,
  Sparkles, ThumbsUp, Layers, Eye, TrendingUp, TrendingDown, Flame,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { profileService } from '../../services/profileService.js';
import { getProfile } from '../../services/getProfile.js';
import { learnedService } from '../../services/learnedService.js';
import { learningTrackingService } from '../../services/learningTrackingService.js';
import { navigate as go } from '../../utils/navigate.js';
import { homePostService } from '../../services/homePostService.js';
import { getPostReactions, sumReactionTotals } from '../../services/reactionTotals.js';
import './LearningPage.css';


const NAV = [
  { id: 'home', label: 'Home', icon: Home, to: '/home' },
  { id: 'discover', label: 'Discover', icon: Compass, to: '/discover' },
  { id: 'learning', label: 'My Learning', icon: BookOpen, to: '/learning' },
  { id: 'create', label: 'Create', icon: PlusCircle, to: '/home' },
  { id: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications' },
  { id: 'profile', label: 'Profile', icon: User, to: '/profile' },
];
const TABS = ['Overview', 'Skills', 'Topics'];
const COLORS = ['#5b8cff', '#a855f7', '#f5a524', '#ec6a9a', '#34d399'];
const CHIP_LIMIT = 8;

// One fixed color per content type (API enum -> label/icon/color)
const CONTENT_TYPES = [
  { key: 'VIDEO', label: 'Short videos', icon: Video, color: '#5b8cff' },
  { key: 'TEXT', label: 'Text posts', icon: Type, color: '#a855f7' },
  { key: 'IMAGE', label: 'Images', icon: ImageIcon, color: '#ec6a9a' },
  { key: 'LONG_FORM', label: 'Documents', icon: FileText, color: '#f5a524' },
];

const rowsOf = (res) => {
  const v = res?.data ?? res;
  if (Array.isArray(v)) return v;
  return v?.data ?? v?.items ?? v?.skills ?? [];
};

// ── Small pieces ────────────────────────────────────────────────────────────
function Card({ title, action, onAction, children, className = '' }) {
  return (
    <section className={`lp-card ${className}`}>
      <header className="lp-card-head">
        <h2>{title}</h2>
        {action && <button type="button" onClick={onAction}>{action}</button>}
      </header>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, value, label, tone, sub }) {
  return (
    <div className="lp-stat">
      <span className={`lp-stat-icon ${tone}`}><Icon size={22} /></span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {sub && <small className="lp-stat-sub">{sub}</small>}
      </div>
    </div>
  );
}

/** Donut chart. parts = [{ label, value, color? }] */
function Donut({ parts, ariaLabel = 'Distribution' }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  const top = [...parts].sort((a, b) => b.value - a.value)[0];
  const colorOf = (p, i) => p.color ?? COLORS[i % COLORS.length];

  return (
    <div className="lp-donut-wrap">
      <svg viewBox="0 0 140 140" className="lp-donut" role="img" aria-label={ariaLabel}>
        <circle cx="70" cy="70" r={R} className="lp-donut-bg" />
        {total > 0 && parts.map((p, i) => {
          const len = (p.value / total) * C;
          const el = (
            <circle key={p.label} cx="70" cy="70" r={R} fill="none"
              stroke={colorOf(p, i)} strokeWidth="16"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
              transform="rotate(-90 70 70)" />
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="lp-donut-num">
          {total ? `${Math.round((top.value / total) * 100)}%` : '0'}
        </text>
        <text x="70" y="86" textAnchor="middle" className="lp-donut-sub">
          {total ? top.label : 'No data'}
        </text>
      </svg>
      <ul className="lp-legend">
        {parts.map((p, i) => (
          <li key={p.label}>
            <i style={{ background: colorOf(p, i) }} />
            <span>{p.label}</span>
            <b>{total ? Math.round((p.value / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Content Types card: bars + percentage + count, and a donut */
function ContentTypesCard({ period, breakdown, loading, error }) {
  const rows = useMemo(
    () => CONTENT_TYPES.map((t) => {
      const d = breakdown.byType[t.key];
      return { ...t, count: d?.count ?? 0, pct: Math.round(d?.percentage ?? 0) };
    }),
    [breakdown],
  );
  const title = `Content explored (${period === 'month' ? 'this month' : 'all time'})`;

  return (
    <Card title={title} className="lp-content-types">
      {error ? (
        <p className="lp-error" role="alert">{error}</p>
      ) : loading && breakdown.total === 0 ? (
        <p className="lp-muted" role="status">Loading…</p>
      ) : breakdown.total === 0 ? (
        <p className="lp-muted">Explore some posts to see your mix.</p>
      ) : (
        <>
          <ul className="lp-types">
            {rows.map(({ key, label, icon: Icon, color, pct, count }) => (
              <li key={key}>
                <Icon size={16} aria-hidden="true" />
                <span className="lp-type-label">{label} <small className="lp-muted">({count})</small></span>
                <div className="lp-bar" role="progressbar" aria-label={label}
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                  <i style={{ width: `${pct}%`, background: color }} />
                </div>
                <b>{pct}%</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
function ChipList({ items, icon: Icon, alt = false, expanded }) {
  const visible = expanded ? items : items.slice(0, CHIP_LIMIT);
  return (
    <div className="lp-chips">
      {visible.map((n) => (
        <span key={n} className={`lp-chip${alt ? ' alt' : ''}`}>
          <Icon size={15} aria-hidden="true" />{n}
        </span>
      ))}
    </div>
  );
}

function ExploredCard({ period, onPeriod, data, loading, error }) {
  const change = data?.change;
  const hasChange = typeof change === 'number';
  const up = hasChange && change >= 0;
  return (
    <Card title="Posts explored" className="lp-explored">
      <div className="lp-toggle" role="group" aria-label="Period">
        {[['month', 'This month'], ['all', 'All time']].map(([id, label]) => (
          <button key={id} type="button" className={period === id ? 'active' : ''}
            aria-pressed={period === id} onClick={() => onPeriod(id)}>{label}</button>
        ))}
      </div>

      {error ? <p className="lp-error" role="alert">{error}</p> : (
        <div className="lp-explored-body">
          <span className="lp-stat-icon blue"><Eye size={22} /></span>
          <div>
            <strong className="lp-explored-num">{loading && !data ? '…' : data?.value ?? 0}</strong>
            <span className="lp-muted">
              {period === 'month' ? 'unique posts this month' : 'unique posts, all time'}
            </span>
          </div>
          {period === 'month' && data && (
            <div className={`lp-change ${hasChange ? (up ? 'up' : 'down') : ''}`}>
              {hasChange ? (
                <>
                  {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(change)}% vs last month
                </>
              ) : (
                <>No data last month</>
              )}
            </div>
          )}
        </div>
      )}
      {period === 'month' && data && (
        <p className="lp-muted lp-explored-foot">All-time: {data.allTime}</p>
      )}
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LearningPage() {
  const user = authService.getCurrentUser();
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [curiosities, setCuriosities] = useState([]);
  const [posts, setPosts] = useState({ totalPosts: 0, imageCount: 0, videoCount: 0, documentCount: 0 });
  const [reactionTotals, setReactionTotals] = useState({ appreciation: 0, helpful: 0, learned: 0 });
  const [learnedCount, setLearnedCount] = useState(null);
  const [streak, setStreak] = useState({ currentStreak: 0, lastLearnedDate: null });
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [skillDist, setSkillDist] = useState({ total: 0, items: [] });
  const [skillDistError, setSkillDistError] = useState('');
  const reqId = useRef(0);

  // Posts Explored + Content breakdown (percentage API)
  const [period, setPeriod] = useState('month');
  const [explored, setExplored] = useState(null);
  const [exploredLoading, setExploredLoading] = useState(true);
  const [exploredError, setExploredError] = useState('');
  const [breakdown, setBreakdown] = useState({ total: 0, byType: {} });
  const [breakdownError, setBreakdownError] = useState('');

  useEffect(() => {
    if (!user) go('/login');
  }, [user]);

  const loadExplored = useCallback(async (p) => {
    const id = ++reqId.current;
    setExploredLoading(true);
    setExploredError('');
    setBreakdownError('');
    setSkillDistError('');

    const [ov, br, sd] = await Promise.allSettled([
      learningTrackingService.getOverview(p),
      learningTrackingService.getContentBreakdown(p),
      learningTrackingService.getSkillDistribution(p),
    ]);
    if (id !== reqId.current) return; // ignore stale responses

    if (ov.status === 'fulfilled') setExplored(ov.value);
    else setExploredError(ov.reason?.message || 'Could not load posts explored.');

    if (br.status === 'fulfilled') setBreakdown(br.value);
    else {
      setBreakdown({ total: 0, byType: {} });
      setBreakdownError(br.reason?.message || 'Could not load content breakdown.');
    }

    if (sd.status === 'fulfilled') setSkillDist(sd.value);
    else {
      setSkillDist({ total: 0, items: [] });
      setSkillDistError(sd.reason?.message || 'Could not load skill distribution.');
    }

    setExploredLoading(false);
  }, []);

  // Refetch when period changes
  useEffect(() => { loadExplored(period); }, [period, loadExplored]);

  // Refetch when a tracking session ends elsewhere in the app
  useEffect(() => {
    const onUpdated = () => loadExplored(period);
    window.addEventListener('learning-updated', onUpdated);
    return () => window.removeEventListener('learning-updated', onUpdated);
  }, [period, loadExplored]);

  useEffect(() => {
    let off = false;

    (async () => {
      try {
        const myId = user?.id ?? user?.userId ?? user?._id;
        const myPosts = await homePostService.getMyPosts(myId);

        // skip local-only posts that have no numeric backend id
        const ids = myPosts
          .map((p) => p.id)
          .filter((id) => /^\d+$/.test(String(id)));

        const results = await Promise.allSettled(ids.map((id) => getPostReactions(id)));
        const ok = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);

        if (!off) setReactionTotals(sumReactionTotals(ok));
      } catch (err) {
        console.error('[LearningPage] Could not load reaction totals:', err);
      }
    })();

    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let off = false;
    (async () => {
      setLoading(true);
      const [p, us, cur, idMap, pc, lc, st] = await Promise.allSettled([
        getProfile.getProfile(),
        profileService.getUserSkills(),
        profileService.getUserCuriosity(),
        profileService.fetchSkillIdToNameMap(),
        profileService.getMyPostCounts(),
        learnedService.getMyLearnedCount(),
        learningTrackingService.getStreak(),
      ]);
      if (off) return;
      const names = idMap.status === 'fulfilled' ? idMap.value : {};
      const nameOf = (id) => names[Number(id)];

      if (p.status === 'fulfilled') setProfile(p.value);
      if (pc.status === 'fulfilled') setPosts(pc.value);
      if (lc.status === 'fulfilled') setLearnedCount(lc.value);
      if (st.status === 'fulfilled') setStreak(st.value);

      if (us.status === 'fulfilled') {
        const seen = new Set();
        setSkills(rowsOf(us.value).flatMap((r) => {
          const name = nameOf(r.skillId);
          const key = `${name}-${r.relationshipType}`;
          if (!name || seen.has(key)) return [];
          seen.add(key);
          return [{ name, type: r.relationshipType }];
        }));
      } else setError('Could not load your skills.');

      if (cur.status === 'fulfilled') {
        setCuriosities([...new Set(rowsOf(cur.value).map((r) => nameOf(r.skillId)).filter(Boolean))]);
      }
      setLoading(false);
    })();
    return () => { off = true; };
  }, []);

  const displayName = (profile?.fullName ?? profile?.name ?? user?.name ?? 'there').split(' ')[0];
  const avatar = profile?.avatarUrl ?? profile?.avatar ?? user?.avatar;

  const allSkillNames = useMemo(() => [...new Set(skills.map((s) => s.name))], [skills]);

  // Top 5 skills + "Other", from the API
  const skillParts = useMemo(() => {
    const sorted = [...skillDist.items]
      .map((i) => ({ label: i.label, value: i.count > 0 ? i.count : i.percentage }))
      .filter((i) => i.value > 0)
      .sort((a, b) => b.value - a.value);

    const top = sorted.slice(0, 5);
    const otherValue = sorted.slice(5).reduce((s, i) => s + i.value, 0);
    return otherValue > 0 ? [...top, { label: 'Other', value: otherValue }] : top;
  }, [skillDist]);

  const show = (section) => tab === 'Overview' || tab === section;

  return (
    <div className="lp-layout">
      <aside className="lp-sidebar" aria-label="Main navigation">
        <img src="/logo-remove.png" alt="EVOLV" className="lp-logo" />
        <nav>
          {NAV.map(({ id, label, icon: Icon, to }) => (
            <button key={id} type="button"
              className={`lp-nav-item ${id === 'learning' ? 'active' : ''}`}
              aria-current={id === 'learning' ? 'page' : undefined}
              onClick={() => go(to)}>
              <Icon size={19} aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="lp-main">
        <div className="lp-topbar">
          <button type="button" className="lp-search" onClick={() => go('/search')}>
            <Search size={17} aria-hidden="true" /> Search skills, topics, people...
          </button>
          <button type="button" className="lp-icon-btn" aria-label="Notifications" onClick={() => go('/notifications')}>
            <Bell size={19} />
          </button>
          <button type="button" className="lp-avatar" aria-label="Open profile" onClick={() => go('/profile')}>
            {avatar ? <img src={avatar} alt="" /> : <span>{displayName[0]?.toUpperCase()}</span>}
          </button>
        </div>

        <header className="lp-title-row">
          <div>
            <h1>My Learning</h1>
            <p>A reflection of your curiosity, growth and learning journey.</p>
          </div>
          <p className="lp-quote">“A little progress each day adds up to big changes.”</p>
          {/* <button type="button" className="lp-primary" onClick={() => go('/profile')}>Set a new goal</button> */}
        </header>

        <section className="lp-hero">
          <h2>Keep evolving, {displayName}</h2>
          <p>
            You've picked {allSkillNames.length} skill{allSkillNames.length === 1 ? '' : 's'} and
            {' '}{curiosities.length} topic{curiosities.length === 1 ? '' : 's'} to explore, shared
            {' '}{posts.totalPosts} post{posts.totalPosts === 1 ? '' : 's'}
            {explored ? ` and explored ${explored.allTime} post${explored.allTime === 1 ? '' : 's'}` : ''}.
            {' '}Small, meaningful steps toward a better you.
          </p>
        </section>

        <div className="lp-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button"
              className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {error && <p className="lp-error" role="alert">{error}</p>}
        {loading ? <p className="lp-muted" role="status">Loading your learning...</p> : (
          <>
            {tab === 'Overview' && (
              <>
                <div className="lp-stats">
                  <Stat icon={BookOpen} value={posts.totalPosts} label="Total explore post" tone="blue" />
                  <Stat icon={Layers} value={allSkillNames.length} label="Total Learned" tone="green" />
                  <Stat
                    icon={Flame}
                    value={streak.currentStreak}
                    label={streak.currentStreak === 1 ? 'Day streak' : 'Day streak'}
                    tone="amber"
                    sub={streak.currentStreak > 0 ? '🔥 Keep it going!' : 'No streak yet'}
                  />
                  <Stat
                    icon={ThumbsUp}
                    value={reactionTotals.helpful}
                    label="Helpful reactions"
                    tone="pink"
                  />
                </div>

                <div className="lp-grid three">
                  <ExploredCard period={period} onPeriod={setPeriod}
                    data={explored} loading={exploredLoading} error={exploredError} />

                  <ContentTypesCard period={period} breakdown={breakdown}
                    loading={exploredLoading} error={breakdownError} />

                  <Card title={`Skill interest (${period === 'month' ? 'this month' : 'all time'})`}>
                    {skillDistError ? (
                      <p className="lp-error" role="alert">{skillDistError}</p>
                    ) : exploredLoading && skillParts.length === 0 ? (
                      <p className="lp-muted" role="status">Loading…</p>
                    ) : skillParts.length === 0 ? (
                      <p className="lp-muted">Explore some posts to see which skills interest you.</p>
                    ) : (
                      <Donut parts={skillParts} ariaLabel="Skill interest distribution" />
                    )}
                  </Card>
                </div>
              </>
            )}

            <div className="lp-grid two">
              {show('Skills') && (
                <Card
                  title="Skills you're exploring"
                  action={allSkillNames.length > CHIP_LIMIT
                    ? (showAllSkills ? 'Show less' : `See all (${allSkillNames.length})`)
                    : undefined}
                  onAction={() => setShowAllSkills((v) => !v)}
                >
                  {allSkillNames.length === 0
                    ? <p className="lp-muted">No skills selected yet.</p>
                    : <ChipList items={allSkillNames} icon={Sparkles} expanded={showAllSkills} />}
                </Card>
              )}

              {show('Topics') && (
                <Card
                  title="Curiosity & Learning Topic"
                  action={curiosities.length > CHIP_LIMIT
                    ? (showAllTopics ? 'Show less' : `See all (${curiosities.length})`)
                    : undefined}
                  onAction={() => setShowAllTopics((v) => !v)}
                >
                  {curiosities.length === 0
                    ? <p className="lp-muted">Pick topics you're curious about in your profile.</p>
                    : <ChipList items={curiosities} icon={Lightbulb} alt expanded={showAllTopics} />}
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      <nav className="lp-bottom-nav" aria-label="Main navigation">
        {NAV.filter((n) => n.id !== 'notifications').map(({ id, label, icon: Icon, to }) => (
          <button key={id} type="button" className={id === 'learning' ? 'active' : ''} onClick={() => go(to)}>
            <Icon size={20} aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}



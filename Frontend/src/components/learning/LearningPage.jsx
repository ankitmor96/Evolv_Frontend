import React, { useEffect, useMemo, useState } from 'react';
import {
  Home, Compass, BookOpen, PlusCircle, Bell, User, Search, Target,
  FileText, Image as ImageIcon, Video, Type, Lightbulb, CheckCircle2,
  Sparkles, ThumbsUp, Layers,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { profileService } from '../../services/profileService.js';
import { getProfile } from '../../services/getProfile.js';
import './LearningPage.css';

const go = (hash) => {
  window.location.hash = hash;
  window.dispatchEvent(new Event('navigated'));
};

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

function Stat({ icon: Icon, value, label, tone }) {
  return (
    <div className="lp-stat">
      <span className={`lp-stat-icon ${tone}`}><Icon size={22} /></span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  const top = [...parts].sort((a, b) => b.value - a.value)[0];
  return (
    <div className="lp-donut-wrap">
      <svg viewBox="0 0 140 140" className="lp-donut" role="img"
        aria-label="Skill distribution">
        <circle cx="70" cy="70" r={R} className="lp-donut-bg" />
        {total > 0 && parts.map((p, i) => {
          const len = (p.value / total) * C;
          const el = (
            <circle key={p.label} cx="70" cy="70" r={R} fill="none"
              stroke={COLORS[i % COLORS.length]} strokeWidth="16"
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
            <i style={{ background: COLORS[i % COLORS.length] }} />
            <span>{p.label}</span>
            <b>{total ? Math.round((p.value / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LearningPage() {
  const user = authService.getCurrentUser();
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);       // { name, type }
  const [curiosities, setCuriosities] = useState([]);
  const [posts, setPosts] = useState({ totalPosts: 0, imageCount: 0, videoCount: 0, documentCount: 0 });
  const [eng, setEng] = useState({ appreciation: 0, helpful: 0, learned: 0 });

  useEffect(() => {
    if (!user) go('/login');
  }, [user]);

  useEffect(() => {
    let off = false;
    (async () => {
      setLoading(true);
      const [p, us, cur, idMap, pc, ec] = await Promise.allSettled([
        getProfile.getProfile(),
        profileService.getUserSkills(),
        profileService.getUserCuriosity(),
        profileService.fetchSkillIdToNameMap(),
        profileService.getMyPostCounts(),
        profileService.getMyEngagementCounts(),
      ]);
      if (off) return;
      const names = idMap.status === 'fulfilled' ? idMap.value : {};
      const nameOf = (id) => names[Number(id)];

      if (p.status === 'fulfilled') setProfile(p.value);
      if (pc.status === 'fulfilled') setPosts(pc.value);
      if (ec.status === 'fulfilled') setEng(ec.value);

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

  const focus = skills.filter((s) => s.type === 'LEARNING' || s.type === 'WANT_TO_IMPROVE');
  const canDo = skills.filter((s) => s.type === 'CAN_DO');
  const allSkillNames = useMemo(() => [...new Set(skills.map((s) => s.name))], [skills]);

  const distribution = [
    { label: 'I can do', value: canDo.length },
    { label: 'Learning', value: skills.filter((s) => s.type === 'LEARNING').length },
    { label: 'Improving', value: skills.filter((s) => s.type === 'WANT_TO_IMPROVE').length },
    { label: 'Curious about', value: curiosities.length },
  ];

  const textCount = Math.max(0, posts.totalPosts - posts.imageCount - posts.videoCount - posts.documentCount);
  const contentTypes = [
    { label: 'Short videos', icon: Video, value: posts.videoCount },
    { label: 'Text posts', icon: Type, value: textCount },
    { label: 'Images', icon: ImageIcon, value: posts.imageCount },
    { label: 'Documents', icon: FileText, value: posts.documentCount },
  ];

  const show = (section) => tab === 'Overview' || tab === section;

  return (
    <div className="lp-layout">
      {/* Sidebar (desktop) */}
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
        {/* Top bar */}
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
          <button type="button" className="lp-primary" onClick={() => go('/profile')}>Set a new goal</button>
        </header>

        <section className="lp-hero">
          <h2>Keep evolving, {displayName}</h2>
          <p>
            You've picked {allSkillNames.length} skill{allSkillNames.length === 1 ? '' : 's'} and
            {' '}{curiosities.length} topic{curiosities.length === 1 ? '' : 's'} to explore, and
            shared {posts.totalPosts} post{posts.totalPosts === 1 ? '' : 's'}. Small, meaningful
            steps toward a better you.
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
              <div className="lp-stats">
                <Stat icon={BookOpen} value={posts.totalPosts} label="Posts shared" tone="blue" />
                <Stat icon={Layers} value={allSkillNames.length} label="Skills selected" tone="green" />
                <Stat icon={CheckCircle2} value={eng.learned} label="Learned reactions" tone="amber" />
                <Stat icon={ThumbsUp} value={eng.helpful} label="Helpful reactions" tone="pink" />
              </div>
            )}

            <div className="lp-grid three">
              {show('Skills') && (
                <Card title="Your growth focus" action="Edit" onAction={() => go('/profile')}>
                  {focus.length === 0 ? <p className="lp-muted">Add skills you're learning to see them here.</p> : (
                    <ul className="lp-focus">
                      {focus.map((f) => (
                        <li key={`${f.name}-${f.type}`}>
                          <Target size={16} aria-hidden="true" />
                          <span>{f.name}</span>
                          <em>{f.type === 'LEARNING' ? 'Learning' : 'Improving'}</em>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}
              {tab === 'Overview' && (
                <Card title="Skill interest distribution"><Donut parts={distribution} /></Card>
              )}
              {tab === 'Overview' && (
                <Card title="Content types">
                  <ul className="lp-types">
                    {contentTypes.map(({ label, icon: Icon, value }) => {
                      const pct = posts.totalPosts ? Math.round((value / posts.totalPosts) * 100) : 0;
                      return (
                        <li key={label}>
                          <Icon size={16} aria-hidden="true" /><span>{label}</span>
                          <div className="lp-bar"><i style={{ width: `${pct}%` }} /></div>
                          <b>{pct}%</b>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}
            </div>

            <div className="lp-grid two">
              {show('Skills') && (
                <Card title="Skills you're exploring" action="See all" onAction={() => go('/discover')}>
                  {allSkillNames.length === 0 ? <p className="lp-muted">No skills selected yet.</p> : (
                    <div className="lp-chips">
                      {allSkillNames.slice(0, 8).map((n) => (
                        <button key={n} type="button" className="lp-chip" onClick={() => go('/discover')}>
                          <Sparkles size={15} aria-hidden="true" />{n}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )}
              {show('Topics') && (
                <Card title="Topics you're curious about" action="See all" onAction={() => go('/discover')}>
                  {curiosities.length === 0 ? <p className="lp-muted">Pick topics you're curious about in your profile.</p> : (
                    <div className="lp-chips">
                      {curiosities.slice(0, 8).map((n) => (
                        <button key={n} type="button" className="lp-chip alt" onClick={() => go('/discover')}>
                          <Lightbulb size={15} aria-hidden="true" />{n}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom nav (mobile) */}
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

import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  FileText,
  PlaySquare,
  Image,
  Newspaper,
  File,
  CircleHelp,
  Trophy,
  Clock,
  ArrowRight
} from 'lucide-react';
import "../discover/DiscoverPage.css";
import { profileService } from "../../services/profileService";

const CONTENT_CATEGORIES = [
  'All Categories',
  'Learning',
  'Tutorial',
  'Guide',
  'Ideas',
  'Case Study',
  'Discussion',
  'Resources',
  'Career',
  'Personal Growth',
];

const CONTENT_TYPES = [
  { id: 'All', label: 'All Content', icon: SlidersHorizontal },
  { id: 'Text', label: 'Text', icon: FileText },
  { id: 'Short Video', label: 'Short Video', icon: PlaySquare },
  { id: 'Photos', label: 'Photos', icon: Image },
  { id: 'Article', label: 'Article', icon: Newspaper },
  { id: 'Document', label: 'Document', icon: File },
  { id: 'Question', label: 'Question', icon: CircleHelp },
  { id: 'Achievement', label: 'Achievement', icon: Trophy },
];

const DEMO_CONTENT = [];
import { homePostService } from "../../services/homePostService";
import { fetchHomeTabs, mapTabsToLabels } from "../../services/homeTabService";
function getTypeIcon(type) {
  if (type === 'Article') return FileText;
  if (type === 'Document') return File;
  return CircleHelp;
}

export default function DiscoverPage() {
  const [contentItems, setContentItems] = useState([]);
  const [domains, setDomains] = useState(["All Domains"]);
  const [domain, setDomain] = useState("All Domains");
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [category, setCategory] = useState('All Categories');
  const [contentType, setContentType] = useState('All');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('all');
  const [myCuriosity, setMyCuriosity] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [interest, setInterest] = useState('');
  const [interestsLoading, setInterestsLoading] = useState(true);

  const interestList = mode === 'curiosity' ? myCuriosity : mode === 'skill' ? mySkills : [];

  const filteredContent = useMemo(() => {
    const query = search.trim().toLowerCase();

    // Words the content must relate to (only in Curiosity / Skill mode)
    const terms =
      mode === 'all' ? null : interest ? [interest] : interestList;

    return contentItems.filter((item) => {
      const hay = [
        item.title, item.description, item.domain, item.category,
        ...(item.tags || []),
      ].join(' ').toLowerCase();

      const matchesMode = terms === null || terms.some((t) => hay.includes(t.toLowerCase()));
      const matchesDomain = mode !== 'all' || domain === 'All Domains' || item.domain === domain;
      const matchesCategory = category === 'All Categories' || item.category === category;
      const matchesType = contentType === 'All' || item.type === contentType;
      const matchesSearch = !query || hay.includes(query);

      return matchesMode && matchesDomain && matchesCategory && matchesType && matchesSearch;
    });
  }, [contentItems, mode, interest, interestList, domain, category, contentType, search]);

  useEffect(() => {
    let cancelled = false;

    const loadDiscoverDomains = async () => {
      try {
        const raw = await fetchHomeTabs();

        if (cancelled) return;

        const payload = raw?.data ?? raw;

        // Use the same tabs array that provides Home's interests.
        const apiTabs = Array.isArray(payload?.tabs)
          ? payload.tabs
          : Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.selectedSkills)
              ? payload.selectedSkills
              : [];

        // Keep individual skill labels instead of grouping by category.
        const seen = new Set();

        const labels = apiTabs
          .map((item) =>
            String(
              item?.label ||
              item?.name ||
              item?.categoryName ||
              ""
            ).trim()
          )
          .filter((label) => {
            if (!label) return false;

            const key = label.toLowerCase();

            // Avoid duplicating the All Domains button.
            if (key === "all domains") return false;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
          });

        const nextDomains = ["All Domains", ...labels];

        setDomains(nextDomains);

        setDomain((current) =>
          nextDomains.includes(current)
            ? current
            : "All Domains"
        );
      } catch (error) {
        console.error(
          "Failed to load Discover domains:",
          error.message
        );
      } finally {
        if (!cancelled) {
          setDomainsLoading(false);
        }
      }
    };

    loadDiscoverDomains();

    return () => {
      cancelled = true;
    };
  }, []);

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
        const rows = (r) => {
          if (r.status !== 'fulfilled') return [];
          const v = r.value;
          return Array.isArray(v) ? v : v?.data ?? v?.items ?? [];
        };
        const toNames = (list) => [
          ...new Set(
            list
              .map((row) => map[Number(row.skillId)])
              .filter((n) => typeof n === 'string' && n.trim())
          ),
        ];

        setMyCuriosity(toNames(rows(curRes)));
        setMySkills(toNames(rows(skillRes)));
      } finally {
        if (!cancelled) setInterestsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const filteredPosts = contentItems.filter((post) => {
    if (domain === "All Domains") return true;

    return (
      post.domain?.toLowerCase() === domain.toLowerCase()
    );
  });

  return (
    <>
      <div className="discover-page">
        {/* Header */}
        <header className="discover-header">
          <div>
            <p className="discover-eyebrow">EXPLORE & LEARN</p>

            <h1>
              Discover something
              <span> worth knowing.</span>
            </h1>

            <p className="discover-subtitle">
              Explore ideas, knowledge and conversations from every domain.
            </p>
          </div>
        </header>

        {/* Search */}
        <div className="discover-search-wrapper">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search articles, documents, questions, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              className="discover-clear"
              onClick={() => setSearch('')}
            >
              Clear
            </button>
          )}
        </div>

        {/* Domain */}
        <section className="discover-filter-section">
          <div className="discover-section-heading">
            <div>
              <p className="discover-section-label">EXPLORE BY INTEREST</p>
              <h2>Find what you’re interested in</h2>
            </div>
          </div>

          {/* Three main buttons */}
          <div className="discover-mode-buttons" role="tablist" aria-label="Content source">
            {[
              { id: 'curiosity', label: 'My Curiosity' },
              { id: 'skill', label: 'My Skills' },
              { id: 'all', label: 'All Content' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={`discover-mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => { setMode(m.id); setInterest(''); }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Chips under the selected button */}
          <div className="discover-domain-scroll">
            {mode === 'all' ? (
              domainsLoading ? (
                <span className="discover-domain-loading">Loading domains...</span>
              ) : (
                domains.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`discover-domain-chip ${domain === item ? 'active' : ''}`}
                    onClick={() => setDomain(item)}
                    aria-pressed={domain === item}
                  >
                    {item}
                  </button>
                ))
              )
            ) : interestsLoading ? (
              <span className="discover-domain-loading">Loading your {mode === 'curiosity' ? 'curiosity' : 'skills'}...</span>
            ) : interestList.length === 0 ? (
              <span className="discover-domain-loading">
                You haven’t added any {mode === 'curiosity' ? 'curiosity topics' : 'skills'} yet.
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className={`discover-domain-chip ${interest === '' ? 'active' : ''}`}
                  onClick={() => setInterest('')}
                >
                  All my {mode === 'curiosity' ? 'curiosity' : 'skills'}
                </button>
                {interestList.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`discover-domain-chip ${interest === name ? 'active' : ''}`}
                    onClick={() => setInterest(name)}
                    aria-pressed={interest === name}
                  >
                    {name}
                  </button>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Filters */}
        <section className="discover-controls">
          <div className="discover-select-group">
            <label>Content Category</label>

            <div className="discover-select-wrapper">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CONTENT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />
            </div>
          </div>

          <div className="discover-type-group">
            <label>Content Type</label>

            <div className="discover-type-buttons">
              {CONTENT_TYPES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  className={`discover-type-btn ${contentType === id ? 'active' : ''
                    }`}
                  onClick={() => setContentType(id)}
                >
                  <span className="discover-type-emoji">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="discover-results">
          <div className="discover-results-header">
            <div>
              <p className="discover-section-label">DISCOVER</p>

              <h2>
                {mode === 'all'
                  ? (domain === 'All Domains' ? 'All content' : domain)
                  : (interest || (mode === 'curiosity' ? 'Based on your curiosity' : 'Based on your skills'))}
              </h2>
            </div>

            <span className="discover-result-count">
              {filteredContent.length} results
            </span>
          </div>

          {filteredContent.length > 0 ? (
            <div className="discover-grid">
              {filteredContent.map((item) => {
                const TypeIcon = getTypeIcon(item.type);

                return (
                  <article
                    key={item.id}
                    className="discover-card"
                  >

                    <div className="discover-card-top">
                      <span className="discover-card-type">
                        <TypeIcon size={15} />
                        {item.type}
                      </span>

                      <span className="discover-card-category">
                        {item.category}
                      </span>
                    </div>

                    {/* Image and video preview */}
                    {item.type === "Image" && item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="content-media"
                        loading="lazy"
                        onError={(e) => {
                          console.error("Image failed to load:", item.image);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    {item.type === "Video" && item.videoUrl && (
                      <video
                        className="content-media"
                        src={item.videoUrl}
                        poster={item.thumbnail}
                        controls
                        preload="metadata"
                      >
                        Your browser does not support video playback.
                      </video>
                    )}

                    <div className="discover-card-domain">
                      {item.domain}
                    </div>

                    <h3>{item.title}</h3>

                    <p className="discover-card-description">
                      {item.description}
                    </p>

                    <div className="discover-tags">
                      {item.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>

                    <div className="discover-card-footer">
                      <div className="discover-author">
                        <div className="discover-author-avatar">
                          {item.author
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .slice(0, 2)}
                        </div>

                        <div>
                          <strong>{item.author}</strong>

                          <span>
                            <Clock size={12} />
                            {item.time}
                          </span>
                        </div>
                      </div>

                      <button
                        className="discover-read-btn"
                        onClick={() =>
                          alert(
                            `Demo content: ${item.title}\n\nBackend integration will be added later.`
                          )
                        }
                      >
                        Explore
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="discover-empty">
              <Search size={32} />
              <h3>No content found</h3>
              <p>
                Try another domain, category, content type or search term.
              </p>

              <button
                onClick={() => {
                  setDomain('All Domains');
                  setCategory('All Categories');
                  setContentType('All');
                  setSearch('');
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );

}

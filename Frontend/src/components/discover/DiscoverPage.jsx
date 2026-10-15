import React, { useMemo, useState } from 'react';
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

const DOMAINS = [
  'All Domains',
  'Technology',
  'Design & Creative',
  'Media & Content',
  'Business & Entrepreneurship',
  'Finance & Economics',
  'Science & Research',
  'Thinking & Intellectual',
  'Communication',
  'Languages & Culture',
  'Arts & Performance',
  'Practical & Craft',
  'Physical & Outdoor',
  'Leadership & Social',
  'Education & Teaching',
  'Life & Personal Development',
];

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

const DEMO_CONTENT = [
  {
    id: 1,
    domain: 'Technology',
    category: 'Tutorial',
    type: 'Article',
    title: 'How Modern Web Applications Are Built',
    description: 'Understand the architecture behind modern web applications, from frontend interfaces to APIs, databases, authentication and deployment.',
    author: 'Aarav Mehta',
    time: '8 min read',
    tags: ['Web Development', 'JavaScript', 'Architecture'],
  },
  {
    id: 2,
    domain: 'Design & Creative',
    category: 'Guide',
    type: 'Image',
    title: 'A Practical UI/UX Design Guide',
    description: 'Explore interface layouts, color systems, typography and visual design principles for better user experiences.',
    author: 'Maya Shah',
    time: '5 images',
    image: '/image-1.avif',
    tags: ['UI/UX', 'Design', 'User Experience'],
  },
  {
    id: 3,
    domain: 'Media & Content',
    category: 'Ideas',
    type: 'Video',
    title: 'How Storytelling Makes Content Memorable',
    description: 'Learn how structure, emotion and context can turn ordinary content into something people remember.',
    author: 'Riya Kapoor',
    time: '6 min',
    videoUrl: '/video.mp4',
    thumbnail: '/image-3.avif',
    tags: ['Storytelling', 'Content', 'Writing'],
  },
  {
    id: 4,
    domain: 'Business & Entrepreneurship',
    category: 'Case Study',
    type: 'Article',
    title: 'From Idea to First Product',
    description: 'Discover how an early product idea can be validated before spending significant time and money.',
    author: 'Dev Patel',
    time: '9 min read',
    tags: ['Startup', 'Product', 'Entrepreneurship'],
  },
  {
    id: 5,
    domain: 'Finance & Economics',
    category: 'Learning',
    type: 'Text',
    title: 'Understanding Personal Finance Basics',
    description: 'Budgeting, saving and investing are important steps toward building healthy financial habits.',
    author: 'Neha Joshi',
    time: '3 min read',
    tags: ['Finance', 'Money', 'Investing'],
  },
  {
    id: 6,
    domain: 'Science & Research',
    category: 'Discussion',
    type: 'Question',
    title: 'What Makes a Research Question Strong?',
    description: 'What makes a research question clear, measurable and worth investigating? Share your thoughts.',
    author: 'Karan Shah',
    time: '12 answers',
    tags: ['Research', 'Science', 'Methodology'],
  },
  {
    id: 7,
    domain: 'Thinking & Intellectual',
    category: 'Ideas',
    type: 'Article',
    title: 'The Difference Between Knowing and Understanding',
    description: 'Discover why memorizing information differs from understanding and applying an idea.',
    author: 'Anaya Rao',
    time: '5 min read',
    tags: ['Critical Thinking', 'Learning', 'Logic'],
  },
  {
    id: 8,
    domain: 'Communication',
    category: 'Guide',
    type: 'Video',
    title: 'Better Communication in Everyday Work',
    description: 'Practical techniques for writing clearer messages, presenting ideas and having productive conversations.',
    author: 'Ishaan Verma',
    time: '8 min',
    videoUrl: '/video.mp4',
    thumbnail: '/image-3.avif',
    tags: ['Communication', 'Presentation', 'Writing'],
  },
  {
    id: 9,
    domain: 'Languages & Culture',
    category: 'Learning',
    type: 'Text',
    title: 'Why Learning a Language Changes How We Think',
    description: 'Explore the connection between language, culture and the way people communicate ideas.',
    author: 'Sara Khan',
    time: '4 min read',
    tags: ['Languages', 'Culture', 'Learning'],
  },
  {
    id: 10,
    domain: 'Arts & Performance',
    category: 'Resources',
    type: 'Image',
    title: 'Creative Practice for Beginners',
    description: 'Discover creative exercises and visual inspiration for music, performance and artistic expression.',
    author: 'Arjun Nair',
    time: '4 images',
    image: '/image-2.avif',
    tags: ['Music', 'Performance', 'Creativity'],
  },
  {
    id: 11,
    domain: 'Practical & Craft',
    category: 'Tutorial',
    type: 'Video',
    title: 'Learning Through Building Things',
    description: 'See how hands-on projects improve problem-solving and turn theoretical knowledge into practical skills.',
    author: 'Kabir Joshi',
    time: '10 min',
    videoUrl: '/video.mp4',
    thumbnail: '/image-3.avif',
    tags: ['DIY', 'Craft', 'Learning'],
  },
  {
    id: 12,
    domain: 'Physical & Outdoor',
    category: 'Personal Growth',
    type: 'Article',
    title: 'Building a Sustainable Fitness Routine',
    description: 'Simple principles for creating an exercise routine that fits into a busy lifestyle.',
    author: 'Meera Patel',
    time: '8 min read',
    tags: ['Fitness', 'Health', 'Habits'],
  },
  {
    id: 13,
    domain: 'Leadership & Social',
    category: 'Discussion',
    type: 'Question',
    title: 'What Makes Someone a Good Leader?',
    description: 'Is leadership mainly about decision-making, empathy, communication or something else?',
    author: 'Rahul Desai',
    time: '24 answers',
    tags: ['Leadership', 'Teamwork', 'Community'],
  },
  {
    id: 14,
    domain: 'Education & Teaching',
    category: 'Achievement',
    type: 'Achievement',
    title: 'Completed a Learning Milestone',
    description: 'Celebrate completing a course, mastering a new skill or reaching an important learning goal.',
    author: 'Priya Mehta',
    time: 'Achievement',
    achievement: {
      title: 'Learning Milestone',
      milestone: 'Course Completed',
    },
    tags: ['Education', 'Achievement', 'Learning'],
  },
  {
    id: 15,
    domain: 'Life & Personal Development',
    category: 'Personal Growth',
    type: 'Text',
    title: 'How Do You Stay Consistent With Your Goals?',
    description: 'What strategies help you continue working toward a goal when motivation disappears?',
    author: 'Vikram Shah',
    time: '3 min read',
    tags: ['Goals', 'Productivity', 'Habits'],
  },
];
import { homePostService } from "../../services/homePostService";
  
function getTypeIcon(type) {
  if (type === 'Article') return FileText;
  if (type === 'Document') return File;
  return CircleHelp;
}

export default function DiscoverPage() {
  const [domain, setDomain] = useState('All Domains');
  const [category, setCategory] = useState('All Categories');
  const [contentType, setContentType] = useState('All');
  const [search, setSearch] = useState('');

  const filteredContent = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contentItems.filter((item) => {
      const matchesDomain =
        domain === 'All Domains' || item.domain === domain;

      const matchesCategory =
        category === 'All Categories' || item.category === category;

      const matchesType =
        contentType === 'All' || item.type === contentType;

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query));

      return (
        matchesDomain &&
        matchesCategory &&
        matchesType &&
        matchesSearch
      );
    });
  }, [domain, category, contentType, search]);


const [contentItems, setContentItems] = useState(DEMO_CONTENT);
const [documentsLoading, setDocumentsLoading] = useState(true);

useEffect(() => {
    const loadDocuments = async () => {
        try {
            const documents = await homePostService.getDocumentPosts();

            setContentItems([
                ...documents.map((doc, index) => ({
                    id: doc.id ?? doc._id ?? `document-${index}`,
                    domain: doc.domain || "Technology",
                    category: doc.category || "Resources",
                    type: "Document",
                    title: doc.title || doc.name || "Untitled Document",
                    description: doc.description || doc.content || "",
                    author: doc.author?.name || doc.author || "EVOLV Member",
                    time: doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : "Document",
                    tags: Array.isArray(doc.tags) ? doc.tags : [],
                    documentUrl: doc.documentUrl || doc.fileUrl || doc.url || "",
                })),
                ...DEMO_CONTENT,
            ]);
        } catch (error) {
            console.error("Failed to load document posts:", error.message);
        }
    };

    loadDocuments();
}, []);


  return (
    <>
      <style>{
        `
                    .discover-page {
  min-height: 100vh;
  background: #faf9fc;
  color: #21172d;
  padding: 38px 46px 60px;
  overflow-y: auto;
}

/* HEADER */

.discover-header {
  max-width: 1050px;
  margin: 0 auto 28px;
}

.discover-eyebrow,
.discover-section-label {
  margin: 0 0 7px;
  color: #9a43df;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.discover-header h1 {
  margin: 0;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.05;
  letter-spacing: -1.7px;
  font-weight: 750;
  color: #1b1225;
}

.discover-header h1 span {
  color: #a044e8;
}

.discover-subtitle {
  margin: 14px 0 0;
  max-width: 650px;
  color: #81768c;
  font-size: 15px;
  line-height: 1.6;
}

/* SEARCH */

.discover-search-wrapper {
  max-width: 1050px;
  height: 52px;
  margin: 0 auto 36px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 17px;
  background: #fff;
  border: 1px solid #e9e2ef;
  border-radius: 13px;
  color: #8e819b;
  box-shadow: 0 5px 20px rgba(46, 20, 69, 0.035);
}

.discover-search-wrapper:focus-within {
  border-color: #a044e8;
  box-shadow: 0 0 0 3px rgba(160, 68, 232, 0.08);
}

.discover-search-wrapper input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 14px;
  color: #24182f;
}

.discover-search-wrapper input::placeholder {
  color: #a59bab;
}

.discover-clear {
  border: 0;
  background: transparent;
  color: #9941d8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* DOMAIN */

.discover-filter-section,
.discover-controls,
.discover-results {
  max-width: 1050px;
  margin-left: auto;
  margin-right: auto;
}

.discover-section-heading h2,
.discover-results-header h2 {
  margin: 0;
  font-size: 23px;
  color: #25182f;
}

.discover-domain-scroll {
  display: flex;
  gap: 8px;
  margin-top: 17px;
  overflow-x: auto;
  padding: 2px 2px 10px;
  scrollbar-width: none;
}

.discover-domain-scroll::-webkit-scrollbar {
  display: none;
}

.discover-domain-chip {
  flex: 0 0 auto;
  border: 1px solid #e3dbe9;
  background: #fff;
  color: #62566c;
  border-radius: 30px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.discover-domain-chip:hover {
  border-color: #b45aef;
  color: #9740d4;
}

.discover-domain-chip.active {
  background: #a044e8;
  border-color: #a044e8;
  color: #fff;
}

/* CONTROLS */

.discover-controls {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 30px;
  margin-top: 27px;
  padding: 20px 0;
  border-top: 1px solid #ece6f0;
  border-bottom: 1px solid #ece6f0;
}

.discover-controls label {
  display: block;
  margin-bottom: 8px;
  color: #74677e;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.discover-select-wrapper {
  position: relative;
}

.discover-select-wrapper select {
  width: 100%;
  height: 42px;
  appearance: none;
  border: 1px solid #e2d9e8;
  border-radius: 9px;
  padding: 0 36px 0 12px;
  background: #fff;
  color: #34283e;
  outline: none;
  font-size: 13px;
  cursor: pointer;
}

.discover-select-wrapper svg {
  position: absolute;
  right: 12px;
  top: 13px;
  pointer-events: none;
  color: #887991;
}

.discover-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.discover-type-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 42px;
  padding: 0 15px;
  border: 1px solid #e2d9e8;
  border-radius: 9px;
  background: #fff;
  color: #62566c;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.discover-type-btn:hover {
  border-color: #a044e8;
  color: #a044e8;
}

.discover-type-btn.active {
  border-color: #a044e8;
  background: rgba(160, 68, 232, 0.08);
  color: #933bd1;
}

/* RESULTS */

.discover-results {
  padding-top: 32px;
}

.discover-results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 18px;
}

.discover-result-count {
  color: #8b7f94;
  font-size: 12px;
}

/* CARDS */

.discover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.discover-card {
  min-width: 0;
  padding: 19px;
  background: #fff;
  border: 1px solid #ebe4ef;
  border-radius: 14px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.discover-card:hover {
  transform: translateY(-2px);
  border-color: rgba(160, 68, 232, 0.3);
  box-shadow: 0 10px 30px rgba(64, 24, 88, 0.07);
}

.discover-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.discover-card-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #9841d6;
  background: rgba(160, 68, 232, 0.08);
  border-radius: 20px;
  padding: 6px 9px;
  font-size: 11px;
  font-weight: 700;
}

.discover-card-category {
  color: #897d91;
  font-size: 11px;
}

.discover-card-domain {
  margin-top: 17px;
  color: #9b44d9;
  font-size: 11px;
  font-weight: 700;
}

.discover-card h3 {
  margin: 6px 0 8px;
  color: #24172e;
  font-size: 18px;
  line-height: 1.3;
}

.discover-card-description {
  margin: 0;
  color: #756a7d;
  font-size: 13px;
  line-height: 1.6;
}

.discover-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
}

.discover-tags span {
  padding: 5px 8px;
  border-radius: 5px;
  background: #f7f3f9;
  color: #71647a;
  font-size: 10px;
  font-weight: 600;
}

.discover-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 19px;
  padding-top: 14px;
  border-top: 1px solid #f0ebf2;
}

.discover-author {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.discover-author-avatar {
  width: 31px;
  height: 31px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eee5f4;
  color: #9841d6;
  font-size: 10px;
  font-weight: 800;
}

.discover-author strong {
  display: block;
  color: #3a2c43;
  font-size: 11px;
}

.discover-author span {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: #9a909f;
  font-size: 10px;
}

.discover-read-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: #9941d8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.discover-read-btn:hover {
  color: #7220aa;
}

/* EMPTY */

.discover-empty {
  text-align: center;
  padding: 70px 20px;
  background: #fff;
  border: 1px solid #ebe4ef;
  border-radius: 14px;
  color: #94889d;
}

.discover-empty h3 {
  margin: 12px 0 5px;
  color: #35283e;
}

.discover-empty p {
  margin: 0 0 18px;
  font-size: 13px;
}

.discover-empty button {
  border: 0;
  background: #a044e8;
  color: #fff;
  padding: 9px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* RESPONSIVE */

@media (max-width: 900px) {
  .discover-page {
    padding: 30px 24px 50px;
  }

  .discover-grid {
    grid-template-columns: 1fr;
  }

  .discover-controls {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

@media (max-width: 600px) {
  .discover-page {
    padding: 24px 15px 40px;
  }

  .discover-header h1 {
    font-size: 34px;
  }

  .discover-search-wrapper {
    margin-bottom: 28px;
  }

  .discover-section-heading h2,
  .discover-results-header h2 {
    font-size: 20px;
  }

  .discover-card {
    padding: 15px;
  }

  .discover-card-footer {
    align-items: flex-end;
  }

  .discover-results-header {
    align-items: center;
  }
}

.content-media {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 16px;
  background: #f3f0f8;
}

.content-media:focus-visible {
  outline: 2px solid #a435f0;
  outline-offset: 3px;
}

                `}</style>
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
              <p className="discover-section-label">EXPLORE BY DOMAIN</p>
              <h2>Find what you’re interested in</h2>
            </div>
          </div>

          <div className="discover-domain-scroll">
            {DOMAINS.map((item) => (
              <button
                key={item}
                className={`discover-domain-chip ${domain === item ? 'active' : ''
                  }`}
                onClick={() => setDomain(item)}
              >
                {item}
              </button>
            ))}
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
                {domain === 'All Domains' ? 'All content' : domain}
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

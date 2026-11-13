import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, UserPlus ,User} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import { headerVariants, EASE_SMOOTH } from './motionVariants';
import { navigate } from '../utils/navigate.js';

// Clean SVG Instagram Icon
const InstagramIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// Clean SVG Facebook Icon
const FacebookIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const serviceMenus = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    icon: <InstagramIcon size={17} />,
    items: [
      { name: 'Followers', href: '/instagram/followers' },
      { name: 'Likes', href: '/instagram/likes' },
      { name: 'Views', href: '/instagram/views' },
      { name: 'Comments', href: '/instagram/comments' },
    ],
  },
  tiktok: {
    id: 'tiktok',
    label: 'Facebook',
    icon: <FacebookIcon size={17} />,
    items: [
      { name: 'Followers', href: '/tiktok/followers' },
      { name: 'Likes', href: '/tiktok/likes' },
      { name: 'Views', href: '/tiktok/views' },
      { name: 'Comments', href: '/tiktok/comments' },
    ],
  },
};

export default function HeroHeader() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);
  const currentRoute = window.location.pathname.replace(/\/+$/, "");

  const hideAuthButtons = [
    "/onboarding",
    "/explore-gems",
  ].some((route) => currentRoute.endsWith(route));
  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  return (
    <motion.header
      className="hero-header-wrapper"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      ref={navRef}
    >
      <nav className="hero-navbar" aria-label="Main Navigation">
        {/* DESKTOP LEFT: Services */}
        <div className="navbar-grid-left">
          {Object.values(serviceMenus).map((service) => {
            const isOpen = openDropdown === service.id;
            return (
              <div key={service.id} className="nav-dropdown-anchor">
                <button
                  type="button"
                  className={`nav-service-trigger ${isOpen ? 'active' : ''}`}
                  onClick={() => toggleDropdown(service.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span className="service-icon">{service.icon}</span>
                  <span className="service-label">{service.label}</span>
                </button>

              </div>
            );
          })}
        </div>

        {/* MOBILE LEFT: Hamburger trigger */}
        <div className="navbar-mobile-left">
          <button
            type="button"
            className="mobile-toggle-btn"
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* CENTER: Mathematically Centered Animated Logo */}
        <div className="navbar-grid-center">
          <AnimatedLogo />
        </div>

        {/* DESKTOP RIGHT: Login & Sign Up */}
        {!hideAuthButtons && (
          <div className="navbar-grid-right">
            <a
              href="/login"
              className="nav-login-link"
              id="nav-login-btn"
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            >
              <LogIn size={15} aria-hidden="true" />
              <span>Login</span>
            </a>

            <a
              href="/signup"
              className="nav-signup-action"
              id="nav-signup-btn"
              onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
            >
              <UserPlus size={15} aria-hidden="true" />
              <span>Sign Up</span>
            </a>
          </div>
        )}

        {!hideAuthButtons && (
          <div className="navbar-mobile-right">
            <a
              href="/login"
              className="mobile-login-icon"
              aria-label="Login"
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            >
              <User size={18}/>
            </a>
          </div>
        )}
      </nav>

      {/* MOBILE EXPANDED MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-nav-panel"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE_SMOOTH }}
          >
            <div className="mobile-nav-content">
              {Object.values(serviceMenus).map((service, idx) => (
                <motion.div
                  key={service.id}
                  className="mobile-service-group"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * idx, duration: 0.2 }}
                >
                  <div className="mobile-group-title">
                    <span className="mobile-group-icon">{service.icon}</span>
                    <span>{service.label}</span>
                  </div>
                </motion.div>
              ))}

              <div className="mobile-divider" />

              {!hideAuthButtons && (
                <motion.div className="mobile-actions">
                  {/* Keep your existing mobile Login and Sign Up links here */}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hero-header-wrapper {
          position: relative;
          width: 100%;
          z-index: 100;
        }

        /* ─── Grid Navbar (Strict Mathematical Centering) ─── */
        .hero-navbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          height: 72px;
          padding: 12px 20px;
          background: #FFFFFF;
          border: var(--border-width, 2.5px) solid var(--border, #09030F);
          border-radius: var(--border-radius-navbar, 18px);
          box-shadow: 3px 3px 0 rgba(9, 3, 15, 0.15);
          position: relative;
        }

        .navbar-grid-left {
          justify-self: start;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .navbar-grid-center {
          justify-self: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navbar-grid-right {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .navbar-mobile-left,
        .navbar-mobile-right {
          display: none;
        }

        /* ─── Services Trigger Button ─── */
        .nav-dropdown-anchor {
          position: relative;
        }

        .nav-service-trigger {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--dark, #09030F);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      color 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      background 200ms cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          white-space: nowrap;
        }

        .nav-service-trigger:hover,
        .nav-service-trigger.active {
          transform: translateY(-1px);
          color: var(--purple, #AA45F5);
          background: #F8F5FF;
        }

        .service-icon {
          display: flex;
          align-items: center;
          color: currentColor;
        }

        .dropdown-chevron {
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
          color: currentColor;
          opacity: 0.7;
        }

        .dropdown-chevron.open {
          transform: rotate(180deg);
        }

        /* ─── Dropdown Menu (No glassmorphism, clean product menu) ─── */
        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 190px;
          background: #FFFFFF;
          border: 2px solid var(--border, #09030F);
          border-radius: 14px;
          padding: 8px;
          box-shadow: 4px 4px 0 rgba(9, 3, 15, 0.14);
          z-index: 120;
          overflow: hidden;
        }

        .dropdown-menu-header {
          padding: 6px 10px 4px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #7C3AED;
          border-bottom: 1px solid #F0EBFA;
          margin-bottom: 4px;
        }

        .dropdown-menu-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-menu-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--dark, #09030F);
          text-decoration: none;
          transition: background 180ms ease, color 180ms ease, transform 180ms ease;
        }

        .dot-bullet {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #C4B5FD;
          transition: background 180ms ease;
        }

        .dropdown-menu-link:hover {
          background: #F3EBFF;
          color: var(--purple-dark, #8B2FD8);
          transform: translateX(2px);
        }

        .dropdown-menu-link:hover .dot-bullet {
          background: var(--purple, #AA45F5);
        }

        /* ─── Right Auth Actions ─── */
        .nav-login-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--dark, #09030F);
          text-decoration: none;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      background 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-login-link:hover {
          transform: translateY(-1px);
          background: #F4F3FA;
        }

        .nav-signup-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--white, #FFFFFF);
          background: var(--dark, #09030F);
          border: 2px solid var(--border, #09030F);
          text-decoration: none;
          box-shadow: 2px 2px 0 rgba(9, 3, 15, 0.2);
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1),
                      background 200ms cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        .nav-signup-action:hover {
          transform: translateY(-2px);
          box-shadow: 4px 4px 0 rgba(9, 3, 15, 0.25);
          background: #1B0F2A;
        }

        .nav-signup-action:active {
          transform: scale(0.98);
        }

        /* ─── Mobile Header Layout (<= 768px) ─── */
        @media (max-width: 768px) {
          .hero-navbar {
            grid-template-columns: 40px 1fr 40px;
            padding: 8px 14px;
            height: 64px;
          }

          .navbar-grid-left,
          .navbar-grid-right {
            display: none;
          }

          .navbar-mobile-left {
            justify-self: start;
            display: flex;
            align-items: center;
          }

          .navbar-mobile-right {
            justify-self: end;
            display: flex;
            align-items: center;
          }

          .mobile-toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 9px;
            border: 2px solid var(--border, #09030F);
            background: #F4F3FA;
            color: var(--dark, #09030F);
            cursor: pointer;
            transition: background 180ms ease, transform 180ms ease;
          }

          .mobile-toggle-btn:active {
            transform: scale(0.95);
          }

          .mobile-login-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 9px;
            border: 2px solid var(--border, #09030F);
            background: #FFFFFF;
            color: var(--dark, #09030F);
            text-decoration: none;
          }
        }

        /* ─── Mobile Dropdown Panel ─── */
        .mobile-nav-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #FFFFFF;
          border: 2.5px solid var(--border, #09030F);
          border-radius: 16px;
          box-shadow: 4px 4px 0 rgba(9, 3, 15, 0.15);
          overflow: hidden;
          z-index: 150;
        }

        .mobile-nav-content {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-service-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mobile-group-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--purple-dark, #8B2FD8);
          padding: 4px 6px;
        }

        .mobile-sublinks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding-left: 6px;
        }

        .mobile-sublink {
          padding: 8px 10px;
          background: #F8F5FF;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--dark, #09030F);
          text-decoration: none;
          border: 1px solid #ECE4FB;
        }

        .mobile-divider {
          height: 1px;
          background: #EAE6F4;
          margin: 4px 0;
        }

        .mobile-actions {
          display: flex;
          gap: 10px;
        }

        .mobile-action-login {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border: 2px solid var(--border, #09030F);
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--dark, #09030F);
          text-decoration: none;
          background: #F4F3FA;
        }

        .mobile-action-signup {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border: 2px solid var(--border, #09030F);
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #FFFFFF;
          background: var(--dark, #09030F);
          text-decoration: none;
        }
      `}</style>
    </motion.header>
  );
}

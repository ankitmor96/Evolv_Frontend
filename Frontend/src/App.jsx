import React, { useEffect, useState } from 'react';
import Hero from './components/Hero';
import Onboarding from './components/onboarding/Onboarding';
import LoginPage from './components/auth/LoginPage';
import ExploreGems from './components/explore/ExploreGems';
import HomePage from './components/home/HomePage';
import MessagesPage from './components/messages/MessagesPage';
import DiscoverPage from './components/discover/DiscoverPage';
import ProfilePage from './components/profile/ProfilePage';
import ReelsPage from './components/reels/ReelPage.jsx';
import ImageViewerPage from './components/image/ImageViewerPage.jsx';
import NotificationsPage from './components/NotificationsPage/NotificationsPage.jsx';
import LegalPage from './components/legal/LegalPage.jsx';
import { guardProtectedRoute } from './services/sessionService.js';
import { startSessionWatcher } from './services/sessionService.js';
import MyPostsViewerPage from './components/profile/MyPostsViewerPage.jsx';
import MyPostFullScreenPage from './components/profile/MyPostFullScreenPage.jsx';
import SearchPage from './components/search/SearchPage.jsx';
import { isTokenExpired, getStoredToken, msUntilExpiry, forceLogout } from './services/sessionService.js';

/**
 * The backend Google OAuth callback redirects to a plain pathname URL like
 * `/login?token=...&email=...&name=...` (or `/login?authError=...`).
 * Because that URL has no hash, getRoute() would return '/' and render the
 * Hero landing page instead of LoginPage, silently discarding the token.
 *
 * This one-time bootstrap converts the pathname redirect into a hash URL so
 * that LoginPage is rendered and can process the callback as designed.
 * The search string is preserved so LoginPage's existing query-param parsing
 * continues to work without any changes.
 */
function bootstrapOAuthCallback() {
  const { pathname, search } = window.location;
  // Only redirect when the backend has delivered a Google callback (/login path
  // + either a token or an authError query param).  Do NOT redirect on normal
  // hash-based navigation (pathname would be '/' in that case).
  if (pathname === '/login') {
    const params = new URLSearchParams(search);
    if (params.has('token') || params.has('authError')) {
      // Replace the history entry so the back-button doesn't loop back here.
      // IMPORTANT: put the search params BEFORE the '#' so that
      //   window.location.search = '?token=...'  (LoginPage reads this)
      //   window.location.hash   = '#/login'     (App.jsx routes to LoginPage)
      // '/#/login?token=...' would put everything into the hash fragment,
      // making window.location.search empty and breaking both reading and routing.
      window.history.replaceState(
        {},
        '',
        '/' + search + '#/login',
      );
      return true; // signal that we mutated the URL
    }
  }
  return false;
}

// Run once before the first React render so the initial route is correct.
bootstrapOAuthCallback();

function getRoute() {
  return window.location.hash.replace(/^#/, '') || '/';
}
// Routes that do NOT require login
const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [allowed, setAllowed] = useState(false);


  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    window.addEventListener('session-expired', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
      window.removeEventListener('session-expired', sync);
    };
  }, []);

  // Auto-logout the moment the token expires, even if the user is idle
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const ms = msUntilExpiry(token);
    if (ms <= 0) { forceLogout(); return; }

    // setTimeout max is ~24.8 days; cap it to be safe
    const timer = setTimeout(() => forceLogout(), Math.min(ms, 2_000_000_000));
    return () => clearTimeout(timer);
  }, [route]);

  // Also re-check when the tab becomes visible again (laptop sleep, etc.)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && getStoredToken() && isTokenExpired()) {
        forceLogout();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
  let cancelled = false;

  // Public pages and onboarding skip the "must be onboarded" guard
  if (PUBLIC_ROUTES.includes(route) || route === '/onboarding') {
    setAllowed(true);
    return;
  }

  setAllowed(false);
  guardProtectedRoute().then((ok) => {
    if (!cancelled) setAllowed(ok);
  });

  return () => { cancelled = true; };
}, [route]);
  useEffect(() => startSessionWatcher(), []);
  if (!allowed) return null;

  // ── Route guard ──
  const isPublic = PUBLIC_ROUTES.includes(route);
  if (!isPublic && isTokenExpired()) {
    // Not logged in or expired: never render protected pages
    if (getStoredToken()) forceLogout(); // clears stale token
    else if (window.location.hash !== '#/login') window.location.hash = '/login';
    return <LoginPage />;
  }

  // Logged-in user visiting /login or /signup goes to home
  if ((route === '/login' || route === '/signup') && !isTokenExpired()) {
    window.location.hash = '/home';
    return null;
  }

  // Hash-based routing
  if (route === '/login' || route === '/signup') {
    return <LoginPage />;
  }
  if (route === '/onboarding') {
    return <Onboarding />;
  }

  if (route === '/explore-gems') {
    return <ExploreGems />;
  }

  if (route === '/home') {
    return <HomePage />;
  }

  if (route === '/messages') {
    return <MessagesPage />;
  }

  if (route === '/discover') {
    return <DiscoverPage />;
  }

  if (route === '/profile') {
    return <ProfilePage />;
  }

  if (route === '/reels') {
    return <ReelsPage />;
  }

  if (route === '/image') {
    return <ImageViewerPage />;
  }
  if (route === '/notifications') {
    return <NotificationsPage />;
  }
  if (route === '/my-posts') {
    return <MyPostsViewerPage />;
  }
  if (route === '/my-post-view') {
    return <MyPostFullScreenPage />;
  }
  if (route === '/search') {
    return <SearchPage />;
  }
  if (route === '/terms') return <LegalPage type="terms" />;
  if (route === '/privacy') return <LegalPage type="privacy" />;
  return <Hero />;
}

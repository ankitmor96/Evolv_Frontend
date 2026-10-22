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

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const sync = () => setRoute(getRoute());
    // hashchange fires when the fragment changes (e.g. /#/login → /#/home).
    // popstate fires on browser back/forward.
    // 'navigated' is a custom event dispatched after history.pushState() calls
    // inside LoginPage, since pushState alone does NOT fire 'popstate'.
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
    };
  }, []);

  // Hash-based routing — consistent with all other routes.
  // /#/login and /#/signup are the auth routes (previously bare /login /signup,
  // which caused Vercel 404s because no server-side rewrite was configured).
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

  return <Hero />;
}

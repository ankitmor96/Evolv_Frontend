import React, { useEffect, useState } from 'react';
import Hero from './components/Hero';
import Onboarding from './components/onboarding/Onboarding';
import LoginPage from './components/auth/LoginPage';
import ExploreGems from './components/explore/ExploreGems';
import HomePage from './components/home/HomePage';
import MessagesPage from './components/messages/MessagesPage';
import DiscoverPage from './components/discover/DiscoverPage';

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

  return <Hero />;
}

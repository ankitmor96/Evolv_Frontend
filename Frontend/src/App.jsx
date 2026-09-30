import React, { useEffect, useState } from 'react';
import Hero from './components/Hero';
import Onboarding from './components/onboarding/Onboarding';
import LoginPage from './components/auth/LoginPage';
import ExploreGems from './components/explore/ExploreGems';

// Auth pages are plain browser paths (/login, /signup) — no router dependency.
const AUTH_PATHS = ['/login', '/signup'];

function getRoute() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function getPathname() {
  return window.location.pathname;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [pathname, setPathname] = useState(getPathname);

  useEffect(() => {
    const sync = () => {
      setRoute(getRoute());
      setPathname(getPathname());
    };
    // 'popstate' fires on browser back/forward.
    // 'navigated' is a custom event dispatched by LoginPage.navigate()
    //  after pushState, since pushState alone does NOT fire 'popstate'.
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
    };
  }, []);

  if (AUTH_PATHS.includes(pathname)) {
    return <LoginPage />;
  }

  if (route === '/onboarding') {
    return <Onboarding />;
  }

  if (route === '/explore-gems') {
    return <ExploreGems />;
  }

  return <Hero />;
}

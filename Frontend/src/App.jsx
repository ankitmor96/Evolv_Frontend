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
import NotificationsPage from './components/NotificationsPage/NotificationsPage.jsx';
import LegalPage from './components/legal/LegalPage.jsx';
import { guardProtectedRoute } from './services/sessionService.js';
import { startSessionWatcher } from './services/sessionService.js';
import MyPostsViewerPage from './components/profile/MyPostsViewerPage.jsx';
import MyPostFullScreenPage from './components/profile/MyPostFullScreenPage.jsx';
import SearchPage from './components/search/SearchPage.jsx';
import UserProfilePage from './components/userProfile/UserProfilePage.jsx';
import DocumentViewerPage from './components/document/DocumentViewerPage.jsx';
import LearningPage from "./components/learning/LearningPage.jsx";
import { isTokenExpired, getStoredToken, msUntilExpiry, forceLogout } from './services/sessionService.js';
import './theme-dark.css';
// ── Admin Panel ────────────────────────────────────────────────────────────────
import AdminLogin from './components/admin/AdminLogin.jsx';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute.jsx';
import Dashboard from './components/admin/Dashboard.jsx';
import UsersManagement from './components/admin/UsersManagement.jsx';
import PostsManagement from './components/admin/PostsManagement.jsx';
import ReportsManagement from './components/admin/ReportsManagement.jsx';
import CommentsManagement from './components/admin/CommentsManagement.jsx';
import ConnectionsManagement from './components/admin/ConnectionsManagement.jsx';
import Analytics from './components/admin/Analytics.jsx';
import Notifications from './components/admin/Notifications.jsx';
import AdminSettings from './components/admin/AdminSettings.jsx';
import { adminService } from './services/adminService.js';
import Report from "./pages/Report.jsx";

function renderAdminRoute(route) {
  if (route === '/admin/login') {
    if (adminService.isLoggedIn()) {
      window.location.hash = '/admin/dashboard';
      return null;
    }
    return <AdminLogin />;
  }
  if (route === '/admin/dashboard') return <AdminProtectedRoute><Dashboard /></AdminProtectedRoute>;
  if (route === '/admin/users') return <AdminProtectedRoute><UsersManagement /></AdminProtectedRoute>;
  if (route === '/admin/posts') return <PostsManagement />;
  if (route === '/admin/reports') return <ReportsManagement />;
  if (route === '/admin/comments') return <AdminProtectedRoute><CommentsManagement /></AdminProtectedRoute>;
  if (route === '/admin/connections') return <AdminProtectedRoute><ConnectionsManagement /></AdminProtectedRoute>;
  if (route === '/admin/analytics') return <AdminProtectedRoute><Analytics /></AdminProtectedRoute>;
  if (route === '/admin/notifications') return <AdminProtectedRoute><Notifications /></AdminProtectedRoute>;
  if (route === '/admin/settings') return <AdminSettings />;
  // Unknown admin route → redirect to dashboard
  window.location.hash = '/admin/dashboard';
  return null;
}
// ──────────────────────────────────────────────────────────────────────────────

function bootstrapOAuthCallback() {
  const { pathname, search } = window.location;
  if (pathname === '/login') {
    const params = new URLSearchParams(search);
    if (params.has('token') || params.has('authError')) {
      window.history.replaceState(
        {},
        '',
        '/' + search + '#/login',
      );
      return true;
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

    if (route.startsWith('/admin/')) {
      setAllowed(true);
      return;
    }
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
  useEffect(() => {
    // Admin authentication is independent of user authentication
    if (window.location.hash.startsWith('#/admin/')) {
      return;
    }

    return startSessionWatcher();
  }, []);

  // ── Admin routes — handled independently, before all user route logic ──────
  if (route.startsWith('/admin/')) {
    return renderAdminRoute(route);
  }
  // ──────────────────────────────────────────────────────────────────────────

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

  if (route === '/learning') {
    return <LearningPage />;
  }

  if (route === '/profile') {
    return <ProfilePage />;
  }

  if (route === '/reels' || route === '/image') {
    return <ReelsPage />;
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
  if (route === '/document') {
    return <DocumentViewerPage />;
  }
  if (route === '/report') {
    return <Report />;
  }
  if (route.startsWith('/profile/')) {
    return <UserProfilePage />;
  }
  if (route === '/terms') return <LegalPage type="terms" />;
  if (route === '/privacy') return <LegalPage type="privacy" />;
  return <Hero />;
}

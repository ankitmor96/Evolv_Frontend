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
import MyPostsViewerPage from './components/profile/MyPostsViewerPage.jsx';
import MyPostFullScreenPage from './components/profile/MyPostFullScreenPage.jsx';
import SearchPage from './components/search/SearchPage.jsx';
import UserProfilePage from './components/userProfile/UserProfilePage.jsx';
import DocumentViewerPage from './components/document/DocumentViewerPage.jsx';
import LearningPage from "./components/learning/LearningPage.jsx";
import {
  guardProtectedRoute, startSessionWatcher,
  isTokenExpired, getStoredToken, msUntilExpiry, forceLogout,
} from './services/sessionService.js';
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
import ConnectionsPage from './components/connection/ConnectionsPage.jsx';
import PublicProfilePage from './components/profile/PublicProfilePage.jsx';
import { adminService } from './services/adminService.js';
import Report from "./pages/Report.jsx";
import { Redirect } from './utils/navigate.js';

function renderAdminRoute(route) {
  if (route === '/admin/login') {
    if (adminService.isLoggedIn()) return <Redirect to="/admin/dashboard" />;
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
  return <Redirect to="/admin/dashboard" />;
}


function getRoute() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/terms', '/privacy'];

function isPublicProfileRoute(route) {
  return /^\/(u|in)\/[^/]+$/.test(route);
}

function isPublicRoute(route) {
  return PUBLIC_ROUTES.includes(route) || isPublicProfileRoute(route);
}
export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [allowed, setAllowed] = useState(false);
  
  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener('popstate', sync);
    window.addEventListener('navigated', sync);
    window.addEventListener('session-expired', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('navigated', sync);
      window.removeEventListener('session-expired', sync);
    };
  }, []);

  // Auto-logout the moment the token expires, even if the user is idle
  useEffect(() => {
    if (isPublicRoute(route)) return; 
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
      if (isPublicRoute(route)) return; 
      if (document.visibilityState === 'visible' && getStoredToken() && isTokenExpired()) {
        forceLogout();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [route]);

  // 1. The allowed effect
useEffect(() => {
  let cancelled = false;

  if (route.startsWith('/admin/')) {
    setAllowed(true);
    return;
  }

  // Public pages, public profiles and onboarding skip the guard
  if (isPublicRoute(route) || route === '/onboarding') {
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
    if (window.location.pathname.startsWith('/admin/')) return;
    return startSessionWatcher();
  }, []);

  // ── Admin routes — handled independently, before all user route logic ──────
  if (route.startsWith('/admin/')) {
    return renderAdminRoute(route);
  }
  // ──────────────────────────────────────────────────────────────────────────

 // 2. The route guard (replace the old isPublic check)
if (!allowed) return null;

const isPublic = isPublicRoute(route);
if (!isPublic && isTokenExpired()) {
  if (getStoredToken()) { forceLogout(); return null; }
  return <Redirect to="/login" />;
} 

  // Logged-in user visiting /login or /signup
  if ((route === '/login' || route === '/signup') && !isTokenExpired()) {
    return <Redirect to="/home" />;
  }

  // Hash-based routing
  if (route === '/login' || route === '/signup') {
    return <LoginPage />;
  }
  if (route === '/onboarding') {
    return <Onboarding />;
  }

  if (isPublicProfileRoute(route)) {
    const username = decodeURIComponent(route.split('/')[2] || '');
    return <PublicProfilePage username={username} />;
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
  if (route.startsWith('/connections/')) {
    return <ConnectionsPage />;
  }
  if (route === '/terms') return <LegalPage type="terms" />;
  if (route === '/privacy') return <LegalPage type="privacy" />;
  return <Hero />;
}

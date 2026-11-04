import { useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { navigate } from '../../utils/navigate.js';

export default function AdminProtectedRoute({ children }) {
  const loggedIn = adminService.isLoggedIn();

  useEffect(() => {
    if (!loggedIn && window.location.pathname !== '/admin/login') {
      navigate('/admin/login', { replace: true });
    }
  }, [loggedIn]);

  return loggedIn ? children : null;
}
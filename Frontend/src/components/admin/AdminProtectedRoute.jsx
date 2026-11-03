import { useEffect } from 'react';
import { adminService } from '../../services/adminService.js';

export default function AdminProtectedRoute({ children }) {
  const loggedIn = adminService.isLoggedIn();

  useEffect(() => {
    if (!loggedIn && window.location.hash !== '#/admin/login') {
      window.location.hash = '/admin/login';
    }
  }, [loggedIn]);

  return loggedIn ? children : null;
}
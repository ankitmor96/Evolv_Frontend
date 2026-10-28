import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../services/notificationService.js';
import { getStoredToken } from '../../services/sessionService.js';

// A notification counts as a "message" one if its type or title says so.
// Check the real "type" value in Postman (e.g. NEW_MESSAGE) and adjust if needed.
export const isMessageNotification = (n) =>
  String(n?.type ?? '').toUpperCase().includes('MESSAGE') ||
  String(n?.title ?? '').toLowerCase() === 'new message';

export function useUnreadCounts() {
  const [counts, setCounts] = useState({ bell: 0, messages: 0 });

  const refresh = useCallback(async () => {
    if (!getStoredToken()) {
      setCounts({ bell: 0, messages: 0 });
      return;
    }
    try {
      const list = await notificationService.getAll();
      const unread = list.filter((n) => !n.isRead);
      const messages = unread.filter(isMessageNotification).length;
      setCounts({ bell: unread.length - messages, messages });
    } catch {
      /* keep previous counts */
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('notifications-changed', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('notifications-changed', refresh);
    };
  }, [refresh]);

  return counts;
}

// Kept so any other file that imports it keeps working
export const useNotificationCount = () => useUnreadCounts().bell;
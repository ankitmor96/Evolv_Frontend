import { useState, useEffect } from 'react';
import { connectionService } from '../../services/connectionService.js';
import { getStoredToken } from '../../services/sessionService.js';

export function useConnectionRequestCount(intervalMs = 15000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!getStoredToken()) { setCount(0); return; }
      const list = await connectionService.getReceivedRequests();
      if (cancelled) return;
      setCount(
        list.filter((r) => String(r?.status ?? 'PENDING').toUpperCase() === 'PENDING').length
      );
    };

    load();
    const t = setInterval(load, intervalMs);
    window.addEventListener('focus', load);
    window.addEventListener('connections-changed', load);

    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener('focus', load);
      window.removeEventListener('connections-changed', load);
    };
  }, [intervalMs]);

  return count;
}
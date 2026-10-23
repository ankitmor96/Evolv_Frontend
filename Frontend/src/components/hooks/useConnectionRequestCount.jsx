import { useState, useEffect } from 'react';
import { connectionService } from '../../services/connectionService.js';

export function useConnectionRequestCount(intervalMs = 30000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const list = await connectionService.getReceivedRequests();
      if (cancelled) return;
      setCount(
        list.filter((r) => String(r?.status ?? 'PENDING').toUpperCase() === 'PENDING').length
      );
    };

    load();
    const t = setInterval(load, intervalMs);
    return () => { cancelled = true; clearInterval(t); };
  }, [intervalMs]);

  return count;
}
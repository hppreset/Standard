import { useEffect, useState } from 'react';

/** Re-rendert im angegebenen Intervall (nur aktiv, wenn `active`). */
export function useNow(intervalMs = 1000, active = true) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}

export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const pad = (n) => String(n).padStart(2, '0');

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ts, n) {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** Woche beginnt am Montag (DE). */
export function startOfWeek(ts) {
  const d = new Date(startOfDay(ts));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function startOfMonth(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function startOfNextMonth(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

export const isSameDay = (a, b) => startOfDay(a) === startOfDay(b);

/** 00:00:00 */
export function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / SEC));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

/** 1:05 (h:mm) */
export function formatDuration(ms) {
  const m = Math.max(0, Math.round(ms / MIN));
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
}

/** 12,5 */
export function formatHours(ms, digits = 1) {
  return (ms / HOUR).toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 09:30 */
export function formatTime(ts) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatEuro(value, digits = 0) {
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDate(ts) {
  const d = new Date(ts);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** yyyy-mm-dd für <input type="date"> */
export function toDateInput(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayLabel(ts, now = Date.now()) {
  const day = startOfDay(ts);
  const today = startOfDay(now);
  if (day === today) return 'Heute';
  if (day === addDays(today, -1)) return 'Gestern';
  return new Date(ts).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function weekRangeLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const a = new Date(weekStart);
  const b = new Date(end);
  const sameMonth = a.getMonth() === b.getMonth();
  const left = a.toLocaleDateString('de-DE', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
  const right = b.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${left}${sameMonth ? '.' : ''} – ${right}`;
}

/**
 * Uhrzeit-Eingabe tolerant parsen: "9", "930", "0930", "9:30", "9.30", "9,30".
 * Gibt Timestamp am Tag von `dayTs` zurück oder null.
 */
export function parseTimeInput(str, dayTs) {
  const s = String(str).trim().replace(/[.,h]/g, ':');
  let h;
  let m;
  if (/^\d{1,2}$/.test(s)) {
    h = +s;
    m = 0;
  } else if (/^\d{3,4}$/.test(s)) {
    h = +s.slice(0, -2);
    m = +s.slice(-2);
  } else {
    const match = s.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) return null;
    h = +match[1];
    m = +match[2];
  }
  if (h > 23 || m > 59) return null;
  const d = new Date(dayTs);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/**
 * Dauer tolerant parsen: "1:30", "1,5", "1.5", "2", "90m", "1h 30m", "45 min".
 * Ganze Zahlen > 12 werden als Minuten interpretiert ("45" → 45 min).
 */
export function parseDurationInput(str) {
  const s = String(str).trim().toLowerCase().replace(',', '.');
  if (!s) return null;
  let m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (m) return (+m[1] * 60 + +m[2]) * MIN + (m[3] ? +m[3] * SEC : 0);
  m = s.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?$/);
  if (m && (m[1] || m[2])) return Math.round((parseFloat(m[1] || 0) * 60 + +(m[2] || 0)) * MIN);
  if (/^\d+$/.test(s)) return +s > 12 ? +s * MIN : +s * HOUR;
  if (/^\d*\.\d+$/.test(s)) return Math.round(parseFloat(s) * HOUR);
  return null;
}

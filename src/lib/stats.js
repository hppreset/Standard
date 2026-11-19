import { HOUR } from './time';

export const entryDuration = (e, now = Date.now()) => Math.max(0, (e.end ?? now) - e.start);

/** Laufenden Timer als virtuellen Eintrag behandeln (für Live-Summen). */
export function withRunning(entries, timer) {
  if (!timer?.start) return entries;
  return [{ ...timer, id: '__running', end: null, note: '' }, ...entries];
}

export const inRange = (entries, from, to) => entries.filter((e) => e.start >= from && e.start < to);

export function summarize(entries, projectsById, now = Date.now()) {
  let total = 0;
  let billable = 0;
  let revenue = 0;
  const byProject = new Map();
  for (const e of entries) {
    const ms = entryDuration(e, now);
    const p = projectsById.get(e.projectId);
    const rate = p?.rate ?? 0;
    total += ms;
    const key = p ? p.id : null;
    const row = byProject.get(key) ?? { project: p ?? null, total: 0, billable: 0, revenue: 0 };
    row.total += ms;
    if (e.billable) {
      billable += ms;
      row.billable += ms;
      revenue += (ms / HOUR) * rate;
      row.revenue += (ms / HOUR) * rate;
    }
    byProject.set(key, row);
  }
  return {
    total,
    billable,
    revenue,
    byProject: [...byProject.values()].sort((a, b) => b.total - a.total),
  };
}

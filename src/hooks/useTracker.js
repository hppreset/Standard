import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEY, loadState, saveState } from '../lib/storage';
import { createSeedState } from '../lib/seed';
import { SEC, uid } from '../lib/time';

const finish = (t, now) => ({
  id: uid(),
  description: t.description.trim(),
  projectId: t.projectId,
  billable: t.billable,
  note: '',
  start: t.start,
  end: Math.max(now, t.start + SEC),
});

/** Zentraler App-State inkl. Persistenz und aller Aktionen. */
export function useTracker() {
  const [state, setState] = useState(loadState);

  useEffect(() => saveState(state), [state]);

  // Mehrere Tabs synchron halten.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setState(JSON.parse(e.newValue));
      } catch {
        /* ignorieren */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const actions = useMemo(
    () => ({
      setTimer: (patch) => setState((s) => ({ ...s, timer: { ...s.timer, ...patch } })),

      /** Startet den Timer. Läuft schon einer, wird er vorher sauber gespeichert. */
      startTimer: (overrides = {}) =>
        setState((s) => {
          const now = Date.now();
          const entries = s.timer.start ? [finish(s.timer, now), ...s.entries] : s.entries;
          return { ...s, entries, timer: { ...s.timer, ...overrides, start: now } };
        }),

      stopTimer: () =>
        setState((s) => {
          if (!s.timer.start) return s;
          return {
            ...s,
            entries: [finish(s.timer, Date.now()), ...s.entries],
            timer: { description: '', projectId: s.timer.projectId, billable: s.timer.billable, start: null },
          };
        }),

      discardTimer: () => setState((s) => ({ ...s, timer: { ...s.timer, description: '', start: null } })),

      addEntry: (entry) => setState((s) => ({ ...s, entries: [{ id: uid(), note: '', ...entry }, ...s.entries] })),
      updateEntry: (id, patch) =>
        setState((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEntry: (id) => setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) })),

      addProject: (p) =>
        setState((s) => ({ ...s, projects: [...s.projects, { id: uid(), createdAt: Date.now(), ...p }] })),
      updateProject: (id, patch) =>
        setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProject: (id) =>
        setState((s) => ({
          ...s,
          projects: s.projects.filter((p) => p.id !== id),
          entries: s.entries.map((e) => (e.projectId === id ? { ...e, projectId: null } : e)),
          timer: s.timer.projectId === id ? { ...s.timer, projectId: null } : s.timer,
        })),

      resetDemo: () => setState(createSeedState()),
    }),
    [],
  );

  const projectsById = useMemo(() => new Map(state.projects.map((p) => [p.id, p])), [state.projects]);

  return { state, actions, projectsById };
}

import { createSeedState } from './seed';

/**
 * Persistenz-Adapter.
 * Aktuell: localStorage. Für Supabase später nur diese Datei austauschen
 * (z. B. load → select aus Tabellen `projects`/`entries`, save → upsert),
 * die UI arbeitet ausschließlich mit loadState/saveState.
 */
export const STORAGE_KEY = 'takt:data:v1';

function normalize(raw) {
  return {
    version: 1,
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    timer: raw.timer ?? { description: '', projectId: null, billable: true, start: null },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return normalize(parsed);
    }
  } catch {
    /* defekte Daten → neu starten */
  }
  return createSeedState();
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Speicher voll / privates Fenster – App läuft im Speicher weiter */
  }
}

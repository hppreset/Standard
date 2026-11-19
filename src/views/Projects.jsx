import { useMemo, useState } from 'react';
import { FolderPlus, Pencil, Play, Plus, Trash2, X } from 'lucide-react';
import { Dot } from '../components/ProjectPicker';
import { summarize, withRunning } from '../lib/stats';
import { HOUR, formatEuro, formatHours } from '../lib/time';

export const PALETTE = [
  '#8170F5', '#60A5FA', '#22D3EE', '#2DD4BF', '#34D399', '#A3E635',
  '#F59E0B', '#F97316', '#F43F5E', '#EC4899', '#C084FC', '#94A3B8',
];

const empty = { name: '', client: '', color: PALETTE[0], rate: '', budgetHours: '' };

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, rate: String(initial.rate ?? ''), budgetHours: initial.budgetHours ? String(initial.budgetHours) : '' }
      : empty,
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toNum = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      client: form.client.trim(),
      color: form.color,
      rate: toNum(form.rate),
      budgetHours: form.budgetHours === '' ? null : toNum(form.budgetHours) || null,
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-4 md:p-5" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{initial ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
        <button type="button" onClick={onCancel} className="icon-btn h-7 w-7" title="Abbrechen">
          <X size={15} />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="label">Projektname *</span>
          <input autoFocus required value={form.name} onChange={set('name')} placeholder="z. B. Website-Relaunch" className="field" />
        </label>
        <label className="block">
          <span className="label">Kunde</span>
          <input value={form.client} onChange={set('client')} placeholder="z. B. Muster GmbH" className="field" />
        </label>
        <label className="block">
          <span className="label">Stundensatz (€)</span>
          <div className="relative">
            <input value={form.rate} onChange={set('rate')} inputMode="decimal" placeholder="0" className="field pr-12 tnum" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">€ / h</span>
          </div>
        </label>
        <label className="block">
          <span className="label">Stundenbudget (optional)</span>
          <div className="relative">
            <input value={form.budgetHours} onChange={set('budgetHours')} inputMode="decimal" placeholder="—" className="field pr-8 tnum" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">h</span>
          </div>
        </label>
      </div>
      <div>
        <span className="label">Farbe</span>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              aria-label={`Farbe ${c}`}
              className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110 ${
                form.color === c ? 'ring-2 ring-fg/70' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Abbrechen</button>
        <button type="submit" className="btn-primary" disabled={!form.name.trim()}>
          {initial ? 'Speichern' : 'Projekt anlegen'}
        </button>
      </div>
    </form>
  );
}

function BudgetBar({ used, budget, color }) {
  if (!budget) return <p className="text-xs text-subtle">Kein Stundenbudget</p>;
  const pct = (used / (budget * HOUR)) * 100;
  const tone = pct >= 100 ? 'rgb(var(--danger))' : pct >= 80 ? '#F59E0B' : color;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted tnum">
          {formatHours(used)} / {budget.toLocaleString('de-DE')} h
        </span>
        <span className="font-medium tnum" style={{ color: pct >= 80 ? tone : undefined }}>
          {Math.round(pct)} %
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elev">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}

export default function Projects({ state, actions, projectsById }) {
  const [editing, setEditing] = useState(null); // null | 'new' | project
  const { projects, entries, timer } = state;

  const stats = useMemo(() => {
    const s = summarize(withRunning(entries, timer), projectsById);
    return new Map(s.byProject.map((r) => [r.project?.id ?? null, r]));
  }, [entries, timer, projectsById]);

  const remove = (p) => {
    const count = entries.filter((e) => e.projectId === p.id).length;
    const msg = count
      ? `„${p.name}“ löschen? ${count} Zeiteinträge bleiben erhalten, aber ohne Projekt.`
      : `„${p.name}“ löschen?`;
    if (window.confirm(msg)) actions.deleteProject(p.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold tracking-tight">Projekte</h1>
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={15} /> Neues Projekt
          </button>
        )}
      </header>

      {editing === 'new' && (
        <ProjectForm
          onCancel={() => setEditing(null)}
          onSave={(p) => {
            actions.addProject(p);
            setEditing(null);
          }}
        />
      )}

      {projects.length === 0 && editing !== 'new' ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <FolderPlus size={22} className="text-subtle" />
          <p className="text-sm text-muted">Noch keine Projekte angelegt.</p>
          <button type="button" onClick={() => setEditing('new')} className="btn-outline">
            <Plus size={15} /> Erstes Projekt anlegen
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) =>
            editing?.id === p.id ? (
              <div key={p.id} className="md:col-span-2">
                <ProjectForm
                  initial={p}
                  onCancel={() => setEditing(null)}
                  onSave={(patch) => {
                    actions.updateProject(p.id, patch);
                    setEditing(null);
                  }}
                />
              </div>
            ) : (
              <article key={p.id} className="card group flex flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                  <Dot color={p.color} className="mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{p.name}</h3>
                    <p className="truncate text-sm text-muted">{p.client || 'Ohne Kunde'}</p>
                  </div>
                  <div className="flex items-center gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
                    <button
                      type="button"
                      className="icon-btn h-7 w-7 hover:text-accent"
                      title="Timer für dieses Projekt starten"
                      onClick={() => actions.startTimer({ description: '', projectId: p.id, billable: p.rate > 0 })}
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                    <button type="button" className="icon-btn h-7 w-7" title="Bearbeiten" onClick={() => setEditing(p)}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="icon-btn h-7 w-7 hover:text-danger" title="Löschen" onClick={() => remove(p)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-subtle">Erfasst</dt>
                    <dd className="font-mono font-medium tnum">{formatHours(stats.get(p.id)?.total ?? 0)} h</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-subtle">Satz</dt>
                    <dd className="font-mono font-medium tnum">{p.rate ? `${p.rate.toLocaleString('de-DE')} €` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-subtle">Umsatz</dt>
                    <dd className="font-mono font-medium tnum">{formatEuro(stats.get(p.id)?.revenue ?? 0)}</dd>
                  </div>
                </dl>

                <BudgetBar used={stats.get(p.id)?.total ?? 0} budget={p.budgetHours} color={p.color} />
              </article>
            ),
          )}
        </div>
      )}
    </div>
  );
}

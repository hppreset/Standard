import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Square } from 'lucide-react';
import EntryRow from '../components/EntryRow';
import { Dot } from '../components/ProjectPicker';
import { useNow } from '../hooks/useNow';
import { entryDuration } from '../lib/stats';
import {
  HOUR, addDays, dayLabel, formatClock, formatDuration, startOfDay, startOfWeek, weekRangeLabel,
} from '../lib/time';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-card p-0.5">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`h-7 rounded-md px-3 text-sm font-medium transition-colors ${
            value === key ? 'bg-elev text-fg shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function WeekStrip({ weekStart, totals, today, onPick, selected }) {
  const max = Math.max(8 * HOUR, ...totals);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {totals.map((ms, i) => {
        const day = addDays(weekStart, i);
        const isToday = day === today;
        const isSel = day === selected;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(day)}
            className={`card flex flex-col gap-2 px-2 py-2.5 text-left transition-colors hover:bg-elev md:px-3 ${
              isSel ? 'border-accent/50' : ''
            }`}
          >
            <div className="flex items-baseline justify-between gap-1">
              <span className={`text-xs font-medium ${isToday ? 'text-accent' : 'text-muted'}`}>{WEEKDAYS[i]}</span>
              <span className="hidden text-xs text-subtle tnum sm:inline">{new Date(day).getDate()}.</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-elev">
              <div
                className={`h-full rounded-full ${isToday ? 'bg-accent' : 'bg-accent/50'}`}
                style={{ width: `${Math.min(100, (ms / max) * 100)}%` }}
              />
            </div>
            <span className={`font-mono text-xs tnum md:text-sm ${ms ? 'text-fg' : 'text-subtle'}`}>
              {formatDuration(ms)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RunningRow({ timer, project, onStop }) {
  const now = useNow(1000);
  return (
    <div className="flex items-center gap-3 border-b border-line bg-accent/[0.06] px-4 py-2.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {timer.description || <span className="text-muted">Ohne Beschreibung</span>}
      </span>
      {project && (
        <span className="hidden items-center gap-1.5 text-xs sm:flex" style={{ color: project.color }}>
          <Dot color={project.color} />
          {project.name}
        </span>
      )}
      <span className="font-mono text-sm font-medium tnum">{formatClock(now - timer.start)}</span>
      <button type="button" onClick={onStop} title="Stoppen" className="icon-btn h-7 w-7 hover:text-danger">
        <Square size={12} fill="currentColor" />
      </button>
    </div>
  );
}

export default function Timesheet({ state, actions, projectsById }) {
  const { entries, projects, timer } = state;
  const [mode, setMode] = useState('today');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(Date.now()));
  const [focusDay, setFocusDay] = useState(null);
  const today = startOfDay(Date.now());
  const currentWeek = startOfWeek(today);
  const displayedWeek = mode === 'today' ? currentWeek : weekStart;

  const weekEntries = useMemo(
    () => entries.filter((e) => e.start >= displayedWeek && e.start < addDays(displayedWeek, 7)),
    [entries, displayedWeek],
  );

  const dayTotals = useMemo(() => {
    const t = Array(7).fill(0);
    for (const e of weekEntries) t[Math.round((startOfDay(e.start) - displayedWeek) / (24 * HOUR))] += entryDuration(e);
    return t;
  }, [weekEntries, displayedWeek]);

  const groups = useMemo(() => {
    const source = mode === 'today' ? weekEntries.filter((e) => startOfDay(e.start) === today) : weekEntries;
    const map = new Map();
    for (const e of [...source].sort((a, b) => b.start - a.start)) {
      const d = startOfDay(e.start);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(e);
    }
    if (mode === 'today' && !map.has(today)) map.set(today, []);
    return [...map.entries()];
  }, [weekEntries, mode, today]);

  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);

  const addManual = () => {
    const base = mode === 'week' && weekStart !== currentWeek ? weekStart : today;
    let end;
    if (base === today) {
      const d = new Date();
      d.setSeconds(0, 0);
      d.setMinutes(Math.floor(d.getMinutes() / 15) * 15);
      end = d.getTime();
    } else {
      end = base + 10 * HOUR;
    }
    actions.addEntry({
      description: '',
      projectId: timer.projectId,
      billable: timer.billable,
      start: end - HOUR,
      end,
    });
  };

  const continueEntry = (e) =>
    actions.startTimer({ description: e.description, projectId: e.projectId, billable: e.billable });

  const pickDay = (day) => {
    if (mode === 'today' && day === today) return;
    setMode('week');
    setWeekStart(startOfWeek(day));
    setFocusDay(day);
    requestAnimationFrame(() =>
      document.getElementById(`day-${day}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold tracking-tight">Timesheet</h1>
        <Segmented value={mode} onChange={(m) => { setMode(m); setFocusDay(null); }} options={[['today', 'Heute'], ['week', 'Woche']]} />
        <button type="button" onClick={addManual} className="btn-outline" title="Eintrag manuell hinzufügen">
          <Plus size={15} /> Eintrag
        </button>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          {mode === 'week' ? (
            <>
              <button type="button" className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, -7))} title="Vorherige Woche">
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="icon-btn"
                disabled={weekStart >= currentWeek}
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                title="Nächste Woche"
              >
                <ChevronRight size={16} className={weekStart >= currentWeek ? 'opacity-30' : ''} />
              </button>
              <span className="text-sm font-medium tnum">
                {weekStart === currentWeek ? 'Diese Woche' : weekRangeLabel(weekStart)}
              </span>
              {weekStart !== currentWeek && (
                <button type="button" className="btn-ghost h-7 px-2 text-xs" onClick={() => setWeekStart(currentWeek)}>
                  Zurück zu heute
                </button>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-muted">Diese Woche</span>
          )}
          <span className="ml-auto text-sm text-muted">
            Gesamt <span className="ml-1 font-mono font-medium text-fg tnum">{formatDuration(weekTotal)}</span>
          </span>
        </div>
        <WeekStrip weekStart={displayedWeek} totals={dayTotals} today={today} onPick={pickDay} selected={focusDay} />
      </section>

      <section className="space-y-5">
        {groups.length === 0 && (
          <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Clock size={22} className="text-subtle" />
            <p className="text-sm text-muted">Keine Einträge in dieser Woche.</p>
          </div>
        )}
        {groups.map(([day, list]) => {
          const total = list.reduce((s, e) => s + entryDuration(e), 0);
          const showRunning = day === today && timer.start && displayedWeek === currentWeek;
          return (
            <div key={day} id={`day-${day}`} className="scroll-mt-24">
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold">{dayLabel(day)}</h2>
                <span className="font-mono text-sm text-muted tnum">{formatDuration(total)}</span>
              </div>
              <div className="card">
                {showRunning && (
                  <RunningRow timer={timer} project={projectsById.get(timer.projectId)} onStop={actions.stopTimer} />
                )}
                {list.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    projects={projects}
                    onUpdate={actions.updateEntry}
                    onDelete={actions.deleteEntry}
                    onContinue={continueEntry}
                  />
                ))}
                {list.length === 0 && !showRunning && (
                  <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
                    <Clock size={20} className="text-subtle" />
                    <p className="text-sm text-muted">Noch nichts erfasst heute.</p>
                    <p className="text-xs text-subtle">
                      Starte oben den Timer – oder drücke <kbd className="rounded border border-line px-1 font-mono">S</kbd>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

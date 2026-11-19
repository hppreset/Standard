import { useMemo, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { Dot } from '../components/ProjectPicker';
import { useNow } from '../hooks/useNow';
import { buildCsv, saveFile } from '../lib/csv';
import { entryDuration, inRange, summarize, withRunning } from '../lib/stats';
import {
  HOUR, addDays, formatDuration, formatEuro, formatHours, startOfDay, startOfMonth, startOfNextMonth,
  startOfWeek, toDateInput,
} from '../lib/time';

const PERIODS = [
  ['week', 'Diese Woche'],
  ['month', 'Dieser Monat'],
  ['lastMonth', 'Letzter Monat'],
  ['all', 'Gesamt'],
];

function rangeFor(period, now) {
  switch (period) {
    case 'week': return [startOfWeek(now), addDays(startOfWeek(now), 7)];
    case 'month': return [startOfMonth(now), startOfNextMonth(now)];
    case 'lastMonth': {
      const start = startOfMonth(startOfMonth(now) - 1);
      return [start, startOfMonth(now)];
    }
    default: return [0, Infinity];
  }
}

function StatCard({ label, ms, sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight tnum">
        {formatHours(ms)}
        <span className="ml-1 text-sm font-normal text-subtle">h</span>
      </p>
      <p className="mt-1 text-xs text-subtle tnum">{sub}</p>
    </div>
  );
}

function DailyBars({ from, to, entries, now }) {
  const days = [];
  for (let d = from; d < to; d = addDays(d, 1)) days.push(d);
  const data = days.map((d) => {
    const list = inRange(entries, d, addDays(d, 1));
    let billable = 0;
    let other = 0;
    for (const e of list) (e.billable ? (billable += entryDuration(e, now)) : (other += entryDuration(e, now)));
    return { d, billable, other };
  });
  const max = Math.max(4 * HOUR, ...data.map((x) => x.billable + x.other));
  const today = startOfDay(now);
  const many = days.length > 10;

  return (
    <div>
      <div className="flex h-36 items-end gap-1">
        {data.map(({ d, billable, other }) => (
          <div
            key={d}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}: ${formatDuration(billable + other)} h (${formatDuration(billable)} abrechenbar)`}
          >
            <div className="flex flex-col justify-end overflow-hidden rounded-[3px]" style={{ height: `${((billable + other) / max) * 100}%` }}>
              <div className="bg-accent/30" style={{ flexGrow: other }} />
              <div className="bg-accent" style={{ flexGrow: billable }} />
            </div>
            {billable + other === 0 && <div className="h-[2px] rounded-full bg-elev" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        {data.map(({ d }, i) => {
          const date = new Date(d);
          const show = !many || i % 5 === 0 || d === today;
          return (
            <span key={d} className={`flex-1 text-center text-[10px] tnum ${d === today ? 'font-semibold text-accent' : 'text-subtle'}`}>
              {show ? (many ? date.getDate() : date.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)) : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Reports({ state, projectsById }) {
  const [period, setPeriod] = useState('week');
  const now = useNow(15000, !!state.timer.start);
  const all = useMemo(() => withRunning(state.entries, state.timer), [state.entries, state.timer]);

  const quick = useMemo(() => {
    const today = startOfDay(now);
    const mk = (from, to) => summarize(inRange(all, from, to), projectsById, now);
    return {
      today: mk(today, addDays(today, 1)),
      week: mk(startOfWeek(now), addDays(startOfWeek(now), 7)),
      month: mk(startOfMonth(now), startOfNextMonth(now)),
    };
  }, [all, projectsById, now]);

  const [from, to] = rangeFor(period, now);
  const periodEntries = useMemo(() => inRange(all, from, to), [all, from, to]);
  const sum = useMemo(() => summarize(periodEntries, projectsById, now), [periodEntries, projectsById, now]);
  const share = sum.total ? sum.billable / sum.total : 0;

  const [fallback, setFallback] = useState(null); // CSV-Text, falls Download hier nicht möglich
  const [copied, setCopied] = useState(false);

  const exportCsv = async () => {
    const finished = periodEntries.filter((e) => e.end);
    const name = period === 'all' ? 'gesamt' : `${toDateInput(from)}_bis_${toDateInput(to - 1)}`;
    const csv = buildCsv(finished, projectsById);
    const result = await saveFile(`zeiterfassung_${name}.csv`, csv);
    if (result === 'unavailable') {
      setCopied(false);
      setFallback(csv.replace(/^\uFEFF/, ''));
    }
  };

  const copyCsv = (e) => {
    const area = e.currentTarget.closest('[data-csv]')?.querySelector('textarea');
    navigator.clipboard?.writeText(fallback).then(
      () => setCopied(true),
      () => area?.select(),
    ) ?? area?.select();
  };

  const exportCount = periodEntries.filter((e) => e.end).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold tracking-tight">Auswertung</h1>
        <button type="button" onClick={exportCsv} disabled={!exportCount} className="btn-primary" title="Einträge des gewählten Zeitraums als CSV">
          <Download size={15} /> CSV exportieren
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Heute" ms={quick.today.total} sub={`${formatHours(quick.today.billable)} h abrechenbar`} />
        <StatCard label="Diese Woche" ms={quick.week.total} sub={`${formatEuro(quick.week.revenue)} Umsatz`} />
        <StatCard label="Dieser Monat" ms={quick.month.total} sub={`${formatEuro(quick.month.revenue)} Umsatz`} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors ${
              period === key ? 'border-accent/50 bg-accent/15 text-accent' : 'border-line text-muted hover:text-fg'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1.6fr]">
        <section className="card flex flex-col p-4">
          <p className="text-xs font-medium text-muted">Anteil abrechenbar</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-tight tnum">
            {Math.round(share * 100)}
            <span className="ml-1 text-lg font-normal text-subtle">%</span>
          </p>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-elev">
            <div className="bg-accent transition-all" style={{ width: `${share * 100}%` }} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-accent" />Abrechenbar</dt>
              <dd className="font-mono tnum">{formatDuration(sum.billable)} h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-accent/30" />Nicht abrechenbar</dt>
              <dd className="font-mono tnum">{formatDuration(sum.total - sum.billable)} h</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="text-muted">Umsatz</dt>
              <dd className="font-mono font-semibold tnum">{formatEuro(sum.revenue, 2)}</dd>
            </div>
          </dl>
        </section>

        <section className="card p-4">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-xs font-medium text-muted">Stunden pro Tag</p>
            <p className="font-mono text-sm tnum">{formatDuration(sum.total)} h</p>
          </div>
          {period === 'all' ? (
            <p className="py-12 text-center text-sm text-subtle">Tagesansicht für Woche oder Monat verfügbar.</p>
          ) : (
            <DailyBars from={from} to={to} entries={periodEntries} now={now} />
          )}
        </section>
      </div>

      <section className="card">
        <div className="hidden grid-cols-[1fr_5rem_5rem_6.5rem] gap-3 border-b border-line px-4 py-2.5 text-xs font-medium text-subtle sm:grid">
          <span>Projekt</span>
          <span className="text-right">Stunden</span>
          <span className="text-right">Abrechenb.</span>
          <span className="text-right">Betrag</span>
        </div>
        {sum.byProject.length === 0 && <p className="px-4 py-10 text-center text-sm text-subtle">Keine Einträge im gewählten Zeitraum.</p>}
        <div className="divide-y divide-line">
        {sum.byProject.map((row) => {
          const p = row.project;
          const pct = sum.total ? (row.total / sum.total) * 100 : 0;
          return (
            <div key={p?.id ?? 'none'} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1fr_5rem_5rem_6.5rem]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Dot color={p?.color} />
                  <span className="truncate text-sm font-medium">{p?.name ?? 'Ohne Projekt'}</span>
                  {p?.client && <span className="hidden truncate text-xs text-subtle md:inline">· {p.client}</span>}
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-elev">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p?.color ?? 'rgb(var(--subtle))' }} />
                </div>
              </div>
              <span className="text-right font-mono text-sm tnum">{formatDuration(row.total)}</span>
              <span className="hidden text-right font-mono text-sm text-muted tnum sm:block">{formatDuration(row.billable)}</span>
              <span className="col-span-2 text-right font-mono text-sm font-medium tnum sm:col-span-1">{formatEuro(row.revenue, 2)}</span>
            </div>
          );
        })}
        </div>
      </section>
      {fallback && (
        <section data-csv className="card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <p className="mr-auto text-sm font-medium">Download in dieser Ansicht nicht möglich – CSV zum Kopieren</p>
            <button type="button" onClick={copyCsv} className="btn-outline h-7 px-2.5 text-xs">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Kopiert' : 'Kopieren'}
            </button>
            <button type="button" onClick={() => setFallback(null)} className="icon-btn h-7 w-7" title="Schließen">
              <X size={14} />
            </button>
          </div>
          <textarea readOnly value={fallback} rows={8} className="field h-auto w-full resize-y py-2 font-mono text-xs" onFocus={(e) => e.target.select()} />
        </section>
      )}
      <p className="text-xs text-subtle">
        CSV: Semikolon-getrennt, Dezimalkomma, UTF-8 – öffnet direkt in Excel/Numbers. Laufende Timer werden nicht exportiert.
      </p>
    </div>
  );
}

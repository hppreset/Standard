import { memo, useState } from 'react';
import { CalendarDays, Play, StickyNote, Trash2 } from 'lucide-react';
import InlineInput from './InlineInput';
import ProjectPicker from './ProjectPicker';
import BillableToggle from './BillableToggle';
import {
  DAY, formatDuration, formatTime, parseDurationInput, parseTimeInput, startOfDay, toDateInput,
} from '../lib/time';

function EntryRow({ entry, projects, onUpdate, onDelete, onContinue }) {
  const [expanded, setExpanded] = useState(false);
  const duration = entry.end - entry.start;
  const day = startOfDay(entry.start);

  const commitStart = (str) => {
    const start = parseTimeInput(str, day);
    if (start == null) return false;
    const end = start < entry.end ? entry.end : start + duration;
    onUpdate(entry.id, { start, end });
  };

  const commitEnd = (str) => {
    let end = parseTimeInput(str, day);
    if (end == null) return false;
    if (end <= entry.start) end += DAY; // über Mitternacht
    onUpdate(entry.id, { end });
  };

  const commitDuration = (str) => {
    const ms = parseDurationInput(str);
    if (!ms || ms <= 0) return false;
    onUpdate(entry.id, { end: entry.start + ms });
  };

  const commitDate = (value) => {
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    const s = new Date(entry.start);
    s.setFullYear(y, m - 1, d);
    onUpdate(entry.id, { start: s.getTime(), end: s.getTime() + duration });
  };

  return (
    <div className="group border-t border-line first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 px-3 py-2 md:flex-nowrap md:px-4">
        <div className="flex min-w-0 basis-full items-center md:flex-1 md:basis-auto">
          <InlineInput
            value={entry.description}
            onCommit={(v) => onUpdate(entry.id, { description: v.trim() })}
            placeholder="Ohne Beschreibung"
            selectOnFocus={false}
            aria-label="Beschreibung"
            className="min-w-0 flex-1 font-medium"
          />
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            title={entry.note ? `Notiz: ${entry.note}` : 'Notiz & Datum'}
            className={`icon-btn h-7 w-7 ${
              entry.note || expanded ? 'text-accent' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
            }`}
          >
            <StickyNote size={14} />
          </button>
          <button type="button" onClick={() => onContinue(entry)} title="Fortsetzen" className="icon-btn h-7 w-7 hover:text-accent md:hidden">
            <Play size={14} fill="currentColor" />
          </button>
        </div>

        <ProjectPicker
          projects={projects}
          value={entry.projectId}
          onChange={(id) => onUpdate(entry.id, { projectId: id })}
          variant="compact"
          align="right"
        />
        <BillableToggle size="sm" value={entry.billable} onChange={(v) => onUpdate(entry.id, { billable: v })} />

        <div className="ml-auto flex items-center text-muted md:ml-1">
          <InlineInput
            value={formatTime(entry.start)}
            onCommit={commitStart}
            aria-label="Startzeit"
            inputMode="numeric"
            className="w-[2.9rem] px-0 text-center text-muted tnum md:w-[3.4rem] md:px-1.5"
          />
          <span className="text-subtle">–</span>
          <InlineInput
            value={formatTime(entry.end)}
            onCommit={commitEnd}
            aria-label="Endzeit"
            inputMode="numeric"
            className="w-[2.9rem] px-0 text-center text-muted tnum md:w-[3.4rem] md:px-1.5"
          />
        </div>

        <InlineInput
          value={formatDuration(duration)}
          onCommit={commitDuration}
          aria-label="Dauer"
          title="Dauer – z. B. 1:30, 1,5 oder 90m"
          className="w-[3.8rem] text-right font-mono font-medium tnum md:w-[4.2rem]"
        />

        <div className="hidden items-center md:flex">
          <button
            type="button"
            onClick={() => onContinue(entry)}
            title="Fortsetzen"
            className="icon-btn h-7 w-7 hover:text-accent"
          >
            <Play size={14} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            title="Löschen"
            className="icon-btn h-7 w-7 hover:text-danger md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 px-3 pb-3 md:flex-row md:items-start md:px-4">
          <textarea
            autoFocus
            defaultValue={entry.note}
            onBlur={(e) => e.target.value !== entry.note && onUpdate(entry.id, { note: e.target.value })}
            placeholder="Notiz (erscheint im CSV-Export) …"
            rows={2}
            className="field h-auto flex-1 resize-y py-2"
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            <CalendarDays size={14} />
            <input
              type="date"
              value={toDateInput(entry.start)}
              onChange={(e) => commitDate(e.target.value)}
              className="field h-9 w-auto tnum"
            />
          </label>
          <button type="button" onClick={() => onDelete(entry.id)} className="btn-ghost h-9 hover:text-danger md:hidden">
            <Trash2 size={14} /> Löschen
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(EntryRow);

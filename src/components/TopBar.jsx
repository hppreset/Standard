import { useEffect, useRef } from 'react';
import { Play, Square, X } from 'lucide-react';
import ProjectPicker from './ProjectPicker';
import BillableToggle from './BillableToggle';
import { useNow } from '../hooks/useNow';
import { formatClock } from '../lib/time';

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export default function TopBar({ timer, projects, projectsById, actions }) {
  const running = !!timer.start;
  const now = useNow(1000, running);
  const elapsed = running ? now - timer.start : 0;
  const inputRef = useRef(null);

  // Tab-Titel zeigt laufende Zeit.
  useEffect(() => {
    document.title = running
      ? `▶ ${formatClock(elapsed)} · ${timer.description || projectsById.get(timer.projectId)?.name || 'Takt'}`
      : 'Takt – Zeiterfassung';
  }, [running, elapsed, timer.description, timer.projectId, projectsById]);

  // Shortcuts: S = Start/Stopp, N = Beschreibung fokussieren.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        running ? actions.stopTimer() : actions.startTimer();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, actions]);

  const pickProject = (id) => {
    const p = projectsById.get(id);
    actions.setTimer({ projectId: id, billable: p ? p.rate > 0 : timer.billable });
  };

  return (
    <div className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 md:flex-nowrap md:gap-3 md:px-8">
        <input
          ref={inputRef}
          value={timer.description}
          onChange={(e) => actions.setTimer({ description: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!running) actions.startTimer();
              e.currentTarget.blur();
            }
          }}
          placeholder="Woran arbeitest du gerade?"
          aria-label="Beschreibung"
          className="h-10 min-w-0 basis-full rounded-md bg-transparent px-1 text-[15px] text-fg placeholder:text-subtle focus:outline-none md:flex-1 md:basis-auto"
        />

        <div className="flex flex-1 items-center gap-2 md:flex-none md:gap-3">
          <ProjectPicker projects={projects} value={timer.projectId} onChange={pickProject} align="right" />
          <BillableToggle value={timer.billable} onChange={(v) => actions.setTimer({ billable: v })} />

          <div
            className={`ml-auto w-[6.5rem] text-right font-mono text-lg font-medium tnum md:ml-1 ${
              running ? 'text-fg' : 'text-subtle'
            }`}
            aria-live="off"
          >
            {formatClock(elapsed)}
          </div>

          {running && (
            <button type="button" onClick={actions.discardTimer} className="icon-btn" title="Timer verwerfen">
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={running ? actions.stopTimer : () => actions.startTimer()}
            title={running ? 'Stoppen (S)' : 'Starten (S)'}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-4 text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.97] ${
              running
                ? 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/60'
                : 'bg-accent text-accent-fg hover:bg-accent/90 focus-visible:ring-accent/60'
            }`}
          >
            {running ? <Square size={14} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            {running ? 'Stopp' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { BarChart3, FolderKanban, ListTodo, Moon, RotateCcw, Sun } from 'lucide-react';
import TopBar from './components/TopBar';
import Timesheet from './views/Timesheet';
import Projects from './views/Projects';
import Reports from './views/Reports';
import { useTracker } from './hooks/useTracker';
import { useTheme } from './hooks/useTheme';

const VIEWS = [
  { id: 'timesheet', label: 'Timesheet', icon: ListTodo },
  { id: 'projects', label: 'Projekte', icon: FolderKanban },
  { id: 'reports', label: 'Auswertung', icon: BarChart3 },
];

const viewFromHash = () => {
  const h = window.location.hash.replace('#/', '');
  return VIEWS.some((v) => v.id === h) ? h : 'timesheet';
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-fg">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="13" r="7" />
          <path d="M12 10v3l2 1.5M10 3h4" />
        </svg>
      </div>
      <span className="text-[15px] font-semibold tracking-tight">Takt</span>
    </div>
  );
}

export default function App() {
  const { state, actions, projectsById } = useTracker();
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useState(viewFromHash);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id) => {
    window.location.hash = `/${id}`;
    setView(id);
  };

  const reset = () => {
    if (window.confirm('Alle Daten löschen und Beispieldaten neu laden?')) actions.resetDemo();
  };

  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const props = { state, actions, projectsById };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line px-3 py-4 md:flex">
        <div className="px-2 pb-6">
          <Logo />
        </div>
        <nav className="flex flex-col gap-0.5">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={`flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors ${
                view === id ? 'bg-elev text-fg' : 'text-muted hover:bg-elev/60 hover:text-fg'
              }`}
            >
              <Icon size={16} className={view === id ? 'text-accent' : ''} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-0.5">
          <p className="px-2 pb-3 text-[11px] leading-relaxed text-subtle">
            <kbd className="rounded border border-line px-1 font-mono">S</kbd> Start/Stopp ·{' '}
            <kbd className="rounded border border-line px-1 font-mono">N</kbd> Neue Aufgabe
          </p>
          <button type="button" onClick={toggleTheme} className="flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm text-muted hover:bg-elev/60 hover:text-fg">
            <ThemeIcon size={16} /> {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button type="button" onClick={reset} className="flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm text-muted hover:bg-elev/60 hover:text-fg">
            <RotateCcw size={16} /> Demo zurücksetzen
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 md:hidden">
          <Logo />
          <button type="button" onClick={toggleTheme} className="icon-btn" title="Theme wechseln">
            <ThemeIcon size={16} />
          </button>
        </div>

        <TopBar timer={state.timer} projects={state.projects} projectsById={projectsById} actions={actions} />

        <nav className="flex gap-1 border-b border-line px-4 py-2 md:hidden">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium ${
                view === id ? 'bg-elev text-fg' : 'text-muted'
              }`}
            >
              <Icon size={15} className={view === id ? 'text-accent' : ''} />
              {label}
            </button>
          ))}
        </nav>

        <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {view === 'timesheet' && <Timesheet {...props} />}
          {view === 'projects' && <Projects {...props} />}
          {view === 'reports' && <Reports {...props} />}
        </main>
      </div>
    </div>
  );
}

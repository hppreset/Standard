import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, FolderClosed, Search } from 'lucide-react';

export const Dot = ({ color, className = '' }) => (
  <span
    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
    style={{ backgroundColor: color || 'rgb(var(--subtle))' }}
  />
);

/** Dropdown mit Farbpunkt, Suche und Tastatursteuerung. */
export default function ProjectPicker({ projects, value, onChange, variant = 'default', align = 'left' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const selected = projects.find((p) => p.id === value) ?? null;

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || (p.client || '').toLowerCase().includes(q),
    );
    return [{ id: null, name: 'Kein Projekt' }, ...list];
  }, [projects, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[active]) pick(options[active].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const compact = variant === 'compact';

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex max-w-full items-center gap-2 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
          compact
            ? 'h-7 border-transparent px-1.5 text-xs hover:border-line'
            : 'h-9 border-line bg-bg px-2.5 text-sm hover:bg-elev'
        }`}
      >
        {selected ? (
          <>
            <Dot color={selected.color} />
            <span className={`truncate font-medium ${compact ? 'max-w-[5rem] sm:max-w-[9rem]' : 'max-w-[7rem] sm:max-w-[11rem]'}`} style={compact ? { color: selected.color } : undefined}>
              {selected.name}
            </span>
          </>
        ) : (
          <>
            <FolderClosed size={compact ? 13 : 15} className="text-subtle" />
            <span className="whitespace-nowrap text-muted">
              {compact ? 'Projekt' : <>Projekt<span className="hidden sm:inline"> wählen</span></>}
            </span>
          </>
        )}
        {!compact && <ChevronDown size={14} className="text-subtle" />}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-72 rounded-lg bg-card p-1 shadow-pop ${align === 'right' ? 'right-0' : 'left-0'}`}
          onKeyDown={onKey}
        >
          <div className="flex items-center gap-2 border-b border-line px-2 pb-1.5 pt-1">
            <Search size={14} className="text-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(e.target.value ? 1 : 0);
              }}
              placeholder="Projekt suchen …"
              className="h-7 w-full bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {options.map((o, i) => (
              <li key={o.id ?? 'none'}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm ${
                    i === active ? 'bg-elev' : ''
                  }`}
                >
                  {o.id ? <Dot color={o.color} /> : <span className="h-2.5 w-2.5 rounded-full border border-subtle" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${o.id ? 'text-fg' : 'text-muted'}`}>{o.name}</span>
                    {o.client && <span className="block truncate text-xs text-subtle">{o.client}</span>}
                  </span>
                  {o.id === value && <Check size={14} className="text-accent" />}
                </button>
              </li>
            ))}
            {options.length === 1 && query && (
              <li className="px-2 py-2 text-xs text-subtle">Kein Projekt gefunden.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

import { Euro } from 'lucide-react';

export default function BillableToggle({ value, onChange, size = 'md' }) {
  const dims = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      title={value ? 'Abrechenbar' : 'Nicht abrechenbar'}
      aria-label="Abrechenbar"
      className={`${dims} inline-flex shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        value
          ? 'border-accent/40 bg-accent/15 text-accent'
          : 'border-transparent text-subtle hover:border-line hover:text-muted'
      }`}
    >
      <Euro size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />
    </button>
  );
}

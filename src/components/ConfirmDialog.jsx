import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Eigener Bestätigungsdialog statt window.confirm():
 * sieht zur App passend aus und funktioniert auch in eingebetteten Ansichten,
 * in denen native Dialoge blockiert sind.
 */
let push = null;

export function confirmDialog(options) {
  return new Promise((resolve) => {
    if (!push) return resolve(false);
    push({ ...options, resolve });
  });
}

export function ConfirmHost() {
  const [req, setReq] = useState(null);
  const okRef = useRef(null);

  useEffect(() => {
    push = setReq;
    return () => {
      push = null;
    };
  }, []);

  useEffect(() => {
    if (!req) return undefined;
    okRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  const close = (value) => {
    req?.resolve(value);
    setReq(null);
  };

  if (!req) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={() => close(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-xl bg-card p-5 shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          {req.danger && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
              <AlertTriangle size={16} />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-sm font-semibold">{req.title}</h2>
            {req.message && <p className="mt-1.5 text-sm text-muted">{req.message}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => close(false)}>Abbrechen</button>
          <button
            ref={okRef}
            type="button"
            onClick={() => close(true)}
            className={req.danger ? 'btn bg-danger text-white hover:bg-danger/90' : 'btn-primary'}
          >
            {req.confirmLabel || 'Bestätigen'}
          </button>
        </div>
      </div>
    </div>
  );
}

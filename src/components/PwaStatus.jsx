import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CloudOff, RefreshCw, Share, SquarePlus, WifiOff, X } from 'lucide-react';
import { useOnline } from '../hooks/usePwa';

function Toast({ icon: Icon, children, onClose, action }) {
  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-card p-3 text-sm shadow-pop">
      <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1 text-fg">{children}</div>
      {action}
      {onClose && (
        <button type="button" onClick={onClose} className="icon-btn -m-1 h-7 w-7" title="Schließen">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Update-Hinweis, „Offline bereit“, Offline-Indikator und iOS-Installationsanleitung. */
export default function PwaStatus({ showIosHint, onCloseIosHint }) {
  const online = useOnline();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Stündlich nach neuer Version schauen (App bleibt oft tagelang offen).
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!offlineReady) return undefined;
    const t = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:items-end">
      {!online && (
        <Toast icon={WifiOff}>
          Offline – alles funktioniert weiter, Daten bleiben lokal gespeichert.
        </Toast>
      )}
      {offlineReady && (
        <Toast icon={CloudOff} onClose={() => setOfflineReady(false)}>
          Takt ist jetzt auch offline verfügbar.
        </Toast>
      )}
      {needRefresh && (
        <Toast
          icon={RefreshCw}
          onClose={() => setNeedRefresh(false)}
          action={
            <button type="button" onClick={() => updateServiceWorker(true)} className="btn-primary -my-1 h-7 px-2.5 text-xs">
              Aktualisieren
            </button>
          }
        >
          Neue Version verfügbar.
        </Toast>
      )}
      {showIosHint && (
        <Toast icon={SquarePlus} onClose={onCloseIosHint}>
          <p className="font-medium">Takt auf dem Home-Bildschirm installieren</p>
          <p className="mt-1 text-muted">
            In Safari auf <Share size={13} className="inline -translate-y-px" /> <b>Teilen</b> tippen und dann{' '}
            <b>„Zum Home-Bildschirm“</b> wählen.
          </p>
        </Toast>
      )}
    </div>
  );
}

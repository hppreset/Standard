import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Installations-Status:
 *  - Chrome/Edge/Android: natives Install-Dialog über `beforeinstallprompt`
 *  - iOS/iPadOS Safari: kein API → Anleitung („Teilen → Zum Home-Bildschirm“)
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const mq = window.matchMedia?.('(display-mode: standalone)');
    const onMq = () => setInstalled(isStandalone());
    mq?.addEventListener?.('change', onMq);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq?.removeEventListener?.('change', onMq);
    };
  }, []);

  // Daten (localStorage) vor automatischer Löschung durch den Browser schützen.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
  }, [installed]);

  const mode = installed ? 'installed' : deferred ? 'prompt' : isIos() ? 'ios' : 'unavailable';

  const install = async () => {
    if (!deferred) return null;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  };

  return { mode, install };
}

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

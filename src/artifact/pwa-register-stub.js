// Artifact-Build: kein Service Worker – gleiche API, keine Wirkung.
const noop = () => {};
export function useRegisterSW() {
  return { offlineReady: [false, noop], needRefresh: [false, noop], updateServiceWorker: noop };
}

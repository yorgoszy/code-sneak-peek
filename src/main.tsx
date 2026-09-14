import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { registerSW } from 'virtual:pwa-register'

// Guard: never register SW in iframes or Lovable preview hosts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com') ||
  window.location.hostname.includes('lovable.app');

if (isPreviewHost || isInIframe) {
  // Unregister any existing service workers in preview/iframe contexts
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
  // Also clear all caches
  caches?.keys().then(keys => keys.forEach(k => caches.delete(k)));
} else if ('serviceWorker' in navigator) {
  const appStart = Date.now();
  let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;
  let updatePending = false;

  const applyIfSafe = () => {
    if (!updatePending || !applyUpdate) return;
    // Apply immediately if the app just opened (no work in progress yet),
    // otherwise wait until the user leaves the tab so nothing gets lost.
    if (Date.now() - appStart < 15000 || document.visibilityState === 'hidden') {
      updatePending = false;
      applyUpdate(true);
    }
  };

  applyUpdate = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Check for a new version periodically and when the app regains focus
      const check = () => registration.update().catch(() => {});
      setInterval(check, 30 * 60 * 1000);
      window.addEventListener('focus', check);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
        else applyIfSafe();
      });
    },
    onNeedRefresh() {
      updatePending = true;
      applyIfSafe();
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

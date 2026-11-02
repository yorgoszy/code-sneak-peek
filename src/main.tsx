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
  // Pull updates on every app entry: check for a new version immediately,
  // and if one takes control shortly after load, reload once to apply it.
  // Mid-session updates are NOT applied (no reload while the user works).
  const pageLoadTime = Date.now();
  let reloaded = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    // Only auto-reload right after entering the app, never mid-session.
    if (Date.now() - pageLoadTime < 30000) {
      reloaded = true;
      window.location.reload();
    }
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      registration?.update();
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

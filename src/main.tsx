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
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available - applying update immediately');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  setInterval(() => {
    updateSW();
  }, 5 * 60 * 1000);
}

createRoot(document.getElementById("root")!).render(<App />);

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
  // Register SW but DO NOT auto-reload on updates.
  // Auto-reload causes the page to refresh when the device wakes from sleep,
  // wiping in-progress chats and form state.
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // New version available — will apply on next manual reload by the user.
      console.log('New content available - will apply on next reload');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);


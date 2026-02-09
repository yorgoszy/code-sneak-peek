import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { registerSW } from 'virtual:pwa-register'

// Force clear ALL old caches on every load
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log('Deleted cache:', name);
    });
  });
}

// Force unregister old service workers and re-register
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update();
    });
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, updating automatically...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

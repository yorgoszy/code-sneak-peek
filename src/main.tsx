import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { registerSW } from 'virtual:pwa-register'

// Register SW - auto update, reload when user returns to tab
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available - applying update immediately');
      // Apply updates immediately to avoid users being stuck on stale UI/roles
      updateSW(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  // Also check for updates periodically (every 5 minutes)
  setInterval(() => {
    updateSW();
  }, 5 * 60 * 1000);
}

createRoot(document.getElementById("root")!).render(<App />);

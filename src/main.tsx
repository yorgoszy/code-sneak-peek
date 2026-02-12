import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { registerSW } from 'virtual:pwa-register'

// Register SW - update when page is hidden (tab not active) to avoid losing work
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available - will update when tab is not active');
      // Update only when user is not actively using the page
      const tryUpdate = () => {
        if (document.hidden) {
          console.log('Tab hidden - applying update now');
          updateSW(true);
        }
      };
      // Try immediately if tab is already hidden
      tryUpdate();
      // Otherwise wait for user to switch away
      document.addEventListener('visibilitychange', tryUpdate, { once: true });
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

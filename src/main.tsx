import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { registerSW } from 'virtual:pwa-register'

// Register SW without aggressive auto-reload to prevent losing unsaved work
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available - will update on next full page load');
      // Do NOT call updateSW(true) here - it forces a reload and loses unsaved data
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

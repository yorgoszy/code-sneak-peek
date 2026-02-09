import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA - auto update immediately
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, updating automatically...');
      updateSW(true); // Force update immediately without asking user
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is running as an installed PWA
 * Returns true only when running as standalone/installed app
 */
export const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
      || document.referrer.includes('android-app://');

    setIsPWA(isStandalone);
  }, []);

  return isPWA;
};

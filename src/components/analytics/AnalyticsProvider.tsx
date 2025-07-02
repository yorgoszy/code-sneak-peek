
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    _paq: any[];
  }
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Placeholder για μελλοντική ενοποίηση tracking scripts
    // Προς το παρόν χρησιμοποιούμε μόνο το Google Analytics Integration component
    console.log('Analytics provider initialized');
  }, []);

  // Track page views when route changes  
  useEffect(() => {
    console.log('Page view tracked:', location.pathname);
  }, [location]);

  return <>{children}</>;
};

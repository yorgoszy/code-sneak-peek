import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FederationLive from '@/pages/Dashboard/FederationLive';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Layout that keeps FederationLive always mounted across federation route navigation.
 * When on /dashboard/federation-live, it shows the live page.
 * When on other federation routes, it hides the live page (display:none) and shows the Outlet.
 * This prevents YouTube iframes from reloading when switching menus.
 */
export const FederationPersistentLayout: React.FC = () => {
  const location = useLocation();
  const { session } = useAuth();
  const isLivePage = location.pathname === '/dashboard/federation-live';

  // Don't render FederationLive if not authenticated
  if (!session) {
    return <Outlet />;
  }

  return (
    <>
      <div style={{ display: isLivePage ? 'block' : 'none', height: isLivePage ? 'auto' : 0, overflow: isLivePage ? 'visible' : 'hidden' }}>
        <FederationLive />
      </div>
      {!isLivePage && <Outlet />}
    </>
  );
};

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FederationLive from '@/pages/Dashboard/FederationLive';
import FederationBrackets from '@/pages/Dashboard/FederationBrackets';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Layout that keeps FederationLive and FederationBrackets always mounted across federation route navigation.
 * Pages are hidden with display:none when not active, preventing YouTube iframes and state from resetting.
 */
export const FederationPersistentLayout: React.FC = () => {
  const location = useLocation();
  const { session } = useAuthContext();
  const isLivePage = location.pathname === '/dashboard/federation-live';
  const isBracketsPage = location.pathname === '/dashboard/federation-brackets';
  const isPersistentPage = isLivePage || isBracketsPage;

  if (!session) {
    return <Outlet />;
  }

  return (
    <>
      <div style={{ display: isLivePage ? 'block' : 'none', height: isLivePage ? 'auto' : 0, overflow: isLivePage ? 'visible' : 'hidden' }}>
        <FederationLive />
      </div>
      <div style={{ display: isBracketsPage ? 'block' : 'none', height: isBracketsPage ? 'auto' : 0, overflow: isBracketsPage ? 'visible' : 'hidden' }}>
        <FederationBrackets />
      </div>
      {!isPersistentPage && <Outlet />}
    </>
  );
};

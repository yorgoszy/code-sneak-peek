import React from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { AdminTrialRequestsBell } from './AdminTrialRequestsBell';

export const AdminGlobalBell: React.FC = () => {
  const { isAdmin, loading } = useRoleCheck();
  if (loading || !isAdmin()) return null;
  return (
    <div className="fixed top-3 right-3 z-[60]">
      <div className="bg-white border border-gray-200 shadow-md p-1">
        <AdminTrialRequestsBell />
      </div>
    </div>
  );
};

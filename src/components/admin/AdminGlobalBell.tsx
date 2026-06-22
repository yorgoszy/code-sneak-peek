import React, { useEffect, useState } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { AdminTrialRequestsBell } from './AdminTrialRequestsBell';
import { supabase } from '@/integrations/supabase/client';

export const AdminGlobalBell: React.FC = () => {
  const { isAdmin, loading } = useRoleCheck();
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (loading || !isAdmin()) return;
    const check = async () => {
      const { count } = await supabase
        .from('trial_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      setHasPending((count || 0) > 0);
    };
    check();
    const channel = supabase
      .channel('admin-bell-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trial_requests' }, check)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loading, isAdmin]);

  if (loading || !isAdmin() || !hasPending) return null;
  return (
    <div className="fixed top-3 right-3 z-[60]">
      <div className="bg-white border border-gray-200 shadow-md p-1">
        <AdminTrialRequestsBell />
      </div>
    </div>
  );
};


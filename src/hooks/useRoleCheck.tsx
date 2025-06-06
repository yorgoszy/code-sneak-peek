
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'trainer' | 'athlete' | 'user' | 'parent';

export const useRoleCheck = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>(['admin']); // Default σε admin για development
  const [loading, setLoading] = useState(false); // Ξεκινάμε με false

  useEffect(() => {
    // Για development, πάντα admin
    setUserRoles(['admin']);
    setLoading(false);
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return true; // Πάντα admin για development
  };

  const isTrainer = (): boolean => {
    return true; // Πάντα trainer για development
  };

  return {
    userRoles,
    hasRole,
    isAdmin,
    isTrainer,
    loading
  };
};

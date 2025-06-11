
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'trainer' | 'athlete' | 'user';

export const useRoleCheck = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching roles for user:', user.id);
        
        // Παίρνουμε τα roles από τον πίνακα user_roles
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Error fetching user roles:', error);
          setUserRoles(['user']); // Default role
        } else if (roleData && roleData.length > 0) {
          const roles = roleData.map(r => r.role as UserRole);
          console.log('✅ User roles fetched:', roles);
          setUserRoles(roles);
        } else {
          // Αν δεν υπάρχουν roles, δίνουμε default 'user'
          console.log('📝 No roles found, setting default user role');
          setUserRoles(['user']);
        }
      } catch (error) {
        console.error('❌ Error in fetchUserRoles:', error);
        setUserRoles(['user']);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return userRoles.includes('admin');
  };

  const isTrainer = (): boolean => {
    return userRoles.includes('trainer') || userRoles.includes('admin');
  };

  const isAthlete = (): boolean => {
    return userRoles.includes('athlete');
  };

  const canManageUsers = (): boolean => {
    return userRoles.includes('admin');
  };

  return {
    userRoles,
    hasRole,
    isAdmin,
    isTrainer,
    isAthlete,
    canManageUsers,
    loading
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'trainer' | 'athlete' | 'general' | 'parent';

export const useRoleCheck = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRoles([]);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile from app_users table
        const { data: profile, error } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserRoles([]);
          setUserProfile(null);
        } else if (profile) {
          setUserProfile(profile);
          // Set role based on the user's role in the database
          setUserRoles([profile.role as UserRole]);
        } else {
          setUserRoles([]);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRoles([]);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return userRoles.includes('admin');
  };

  const isTrainer = (): boolean => {
    return userRoles.includes('trainer');
  };

  const isAthlete = (): boolean => {
    return userRoles.includes('athlete');
  };

  const isGeneral = (): boolean => {
    return userRoles.includes('general');
  };

  return {
    userRoles,
    userProfile,
    hasRole,
    isAdmin,
    isTrainer,
    isAthlete,
    isGeneral,
    loading
  };
};

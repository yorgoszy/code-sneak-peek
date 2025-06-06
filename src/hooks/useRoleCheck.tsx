
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'trainer' | 'athlete' | 'user' | 'parent';

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
        console.log('🔍 Checking roles for user:', user.id, user.email);
        
        // First get the app_user record
        const { data: appUser, error: appUserError } = await supabase
          .from('app_users')
          .select('id, name, role')
          .eq('auth_user_id', user.id)
          .single();

        console.log('👤 App user data:', appUser, 'Error:', appUserError);

        if (!appUser) {
          // If no app_user found, check if there's one with email match
          const { data: emailUser } = await supabase
            .from('app_users')
            .select('id, name, role')
            .eq('email', user.email)
            .single();
          
          console.log('📧 Email match user:', emailUser);
          
          if (emailUser) {
            // Use the role from app_users table
            const roleFromTable = emailUser.role as UserRole;
            setUserRoles([roleFromTable]);
            console.log('✅ Using role from app_users table:', roleFromTable);
          } else {
            // If no user found at all, default to admin for testing
            console.log('⚠️ No user found, defaulting to admin role for testing');
            setUserRoles(['admin']);
          }
          setLoading(false);
          return;
        }

        // Check if there's a role in the app_users table
        if (appUser.role) {
          const roleFromTable = appUser.role as UserRole;
          setUserRoles([roleFromTable]);
          console.log('✅ Using role from app_users table:', roleFromTable);
        } else {
          // Then get the user roles from user_roles table
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', appUser.id);

          console.log('🎭 User roles data:', roles, 'Error:', rolesError);
          
          if (roles && roles.length > 0) {
            setUserRoles(roles.map(r => r.role as UserRole));
          } else {
            // If no roles found, default to admin for testing
            console.log('⚠️ No roles found, defaulting to admin role for testing');
            setUserRoles(['admin']);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user roles:', error);
        // Default to admin role if there's an error
        console.log('⚠️ Error occurred, defaulting to admin role for testing');
        setUserRoles(['admin']);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    const result = userRoles.includes(role);
    console.log('🔐 Checking role:', role, 'User roles:', userRoles, 'Result:', result);
    return result;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isTrainer = (): boolean => {
    return hasRole('trainer') || hasRole('admin');
  };

  return {
    userRoles,
    hasRole,
    isAdmin,
    isTrainer,
    loading
  };
};

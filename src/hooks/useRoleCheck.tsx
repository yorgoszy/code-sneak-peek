
import { useAuthContext } from '@/contexts/AuthContext';

type UserRole = 'admin' | 'coach' | 'trainer' | 'athlete' | 'general' | 'parent'; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @deprecated Use useAuthContext directly for full functionality.
 * This hook is kept for backward compatibility.
 */
export const useRoleCheck = () => {
  const context = useAuthContext();

  return {
    userRoles: context.userRoles,
    userProfile: context.userProfile,
    hasRole: context.hasRole,
    isAdmin: context.isAdmin,
    isCoach: context.isCoach,
    isTrainer: context.isTrainer,
    isAthlete: context.isAthlete,
    isGeneral: context.isGeneral,
    isParent: context.isParent,
    loading: context.rolesLoading,
  };
};


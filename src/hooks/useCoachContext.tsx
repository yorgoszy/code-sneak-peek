import { useMemo } from 'react';
import { useRoleCheck } from './useRoleCheck';

/**
 * Hook for coach multi-tenant context
 * Returns the coach_id to filter data, or null if admin (sees all)
 */
export const useCoachContext = () => {
  const { userProfile, isAdmin, isCoach, loading } = useRoleCheck();

  const coachId = useMemo(() => {
    if (loading || !userProfile) return undefined;
    
    // Admin sees everything - no filter
    if (isAdmin()) return null;
    
    // Coach sees their own data
    if (isCoach()) return userProfile.id;
    
    // Other users belong to a coach
    return userProfile.coach_id || null;
  }, [userProfile, loading, isAdmin, isCoach]);

  const isCoachUser = useMemo(() => {
    return isCoach();
  }, [isCoach]);

  const isAdminUser = useMemo(() => {
    return isAdmin();
  }, [isAdmin]);

  // Helper to add coach_id to insert operations
  const getInsertCoachId = () => {
    if (isAdmin()) return null; // Admin creates without coach_id
    if (isCoach()) return userProfile?.id; // Coach assigns to themselves
    return userProfile?.coach_id || null;
  };

  // Helper to filter queries based on coach_id
  const buildCoachFilter = (query: any) => {
    if (isAdmin()) return query; // No filter for admin
    if (isCoach()) {
      // Coach sees their own + legacy (null coach_id)
      return query.or(`coach_id.eq.${userProfile?.id},coach_id.is.null`);
    }
    return query;
  };

  return {
    coachId,
    isCoachUser,
    isAdminUser,
    userProfile,
    loading,
    getInsertCoachId,
    buildCoachFilter
  };
};


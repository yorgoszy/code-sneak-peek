import React, { createContext, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRoleCheck } from '@/hooks/useRoleCheck';

interface CoachContextType {
  coachId: string | null;
  isLoading: boolean;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

interface CoachProviderProps {
  children: React.ReactNode;
}

export const CoachProvider: React.FC<CoachProviderProps> = ({ children }) => {
  const { userProfile, isAdmin, isCoach, loading } = useRoleCheck();
  const [searchParams] = useSearchParams();
  const coachIdFromUrl = searchParams.get('coachId');

  const coachId = useMemo(() => {
    // Admin με coachId στο URL -> χρησιμοποιεί αυτό το coachId
    if (isAdmin() && coachIdFromUrl) {
      return coachIdFromUrl;
    }
    // Admin χωρίς coachId στο URL -> χρησιμοποιεί το δικό του id για πρόσβαση σε Coach pages
    if (isAdmin()) {
      return userProfile?.id ?? null;
    }
    // Coach -> χρησιμοποιεί το δικό του id
    if (isCoach()) {
      return userProfile?.id ?? null;
    }
    // Fallback
    return null;
  }, [isAdmin, isCoach, coachIdFromUrl, userProfile?.id]);

  const value = useMemo(() => ({
    coachId,
    isLoading: loading,
  }), [coachId, loading]);

  return (
    <CoachContext.Provider value={value}>
      {children}
    </CoachContext.Provider>
  );
};

export const useCoachContext = (): CoachContextType => {
  const context = useContext(CoachContext);
  if (context === undefined) {
    throw new Error('useCoachContext must be used within a CoachProvider');
  }
  return context;
};

// Safe version that returns null if not within CoachProvider
export const useSafeCoachContext = (): CoachContextType | null => {
  const context = useContext(CoachContext);
  return context ?? null;
};

// Hook that throws if coachId is null (for components that require a coachId)
export const useRequiredCoachId = (): string => {
  const { coachId, isLoading } = useCoachContext();
  
  if (isLoading) {
    throw new Error('Coach context is still loading');
  }
  
  if (!coachId) {
    throw new Error('No coachId available in context');
  }
  
  return coachId;
};

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
    // Coach -> χρησιμοποιεί το δικό του id
    if (isCoach()) {
      return userProfile?.id ?? null;
    }
    // Fallback για admin χωρίς coachId (δεν θα έπρεπε να συμβαίνει στο coach dashboard)
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

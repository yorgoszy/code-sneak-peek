import React, { createContext, useContext, ReactNode } from 'react';
import { useFmsExerciseStatus, FmsStatus } from '@/hooks/useFmsExerciseStatus';

interface FmsExerciseStatusContextType {
  exerciseStatusMap: Map<string, FmsStatus>;
  loading: boolean;
  userFmsScores: Record<string, number> | null;
}

const FmsExerciseStatusContext = createContext<FmsExerciseStatusContextType | null>(null);

interface FmsExerciseStatusProviderProps {
  children: ReactNode;
  userId: string | null;
}

export const FmsExerciseStatusProvider: React.FC<FmsExerciseStatusProviderProps> = ({ 
  children, 
  userId 
}) => {
  const fmsData = useFmsExerciseStatus(userId);

  return (
    <FmsExerciseStatusContext.Provider value={fmsData}>
      {children}
    </FmsExerciseStatusContext.Provider>
  );
};

export const useFmsExerciseStatusContext = (): FmsExerciseStatusContextType => {
  const context = useContext(FmsExerciseStatusContext);
  if (!context) {
    // Return default values if not in provider (graceful fallback)
    return {
      exerciseStatusMap: new Map(),
      loading: false,
      userFmsScores: null
    };
  }
  return context;
};

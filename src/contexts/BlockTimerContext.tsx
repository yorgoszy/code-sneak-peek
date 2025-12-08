
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface BlockTimerState {
  remainingSeconds: number;
  initialSeconds: number;
  timerActive: boolean;
  completedSets: number;
}

interface BlockTimerContextType {
  getBlockState: (blockId: string) => BlockTimerState | undefined;
  setBlockTimer: (blockId: string, remainingSeconds: number, initialSeconds: number, timerActive: boolean) => void;
  setBlockSets: (blockId: string, completedSets: number) => void;
  initializeBlock: (blockId: string, initialSeconds: number, totalSets: number) => void;
  clearAllStates: () => void;
}

const BlockTimerContext = createContext<BlockTimerContextType | null>(null);

export const BlockTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blockStates, setBlockStates] = useState<Record<string, BlockTimerState>>({});
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const getBlockState = useCallback((blockId: string) => {
    return blockStates[blockId];
  }, [blockStates]);

  const setBlockTimer = useCallback((blockId: string, remainingSeconds: number, initialSeconds: number, timerActive: boolean) => {
    setBlockStates(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        remainingSeconds,
        initialSeconds,
        timerActive,
        completedSets: prev[blockId]?.completedSets || 0
      }
    }));
  }, []);

  const setBlockSets = useCallback((blockId: string, completedSets: number) => {
    setBlockStates(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        completedSets,
        remainingSeconds: prev[blockId]?.remainingSeconds || 0,
        initialSeconds: prev[blockId]?.initialSeconds || 0,
        timerActive: prev[blockId]?.timerActive || false
      }
    }));
  }, []);

  const initializeBlock = useCallback((blockId: string, initialSeconds: number, totalSets: number) => {
    setBlockStates(prev => {
      // Only initialize if not already present
      if (prev[blockId]) return prev;
      return {
        ...prev,
        [blockId]: {
          remainingSeconds: initialSeconds,
          initialSeconds,
          timerActive: false,
          completedSets: 0
        }
      };
    });
  }, []);

  const clearAllStates = useCallback(() => {
    // Clear all intervals
    Object.values(intervalsRef.current).forEach(interval => clearInterval(interval));
    intervalsRef.current = {};
    setBlockStates({});
  }, []);

  return (
    <BlockTimerContext.Provider value={{
      getBlockState,
      setBlockTimer,
      setBlockSets,
      initializeBlock,
      clearAllStates
    }}>
      {children}
    </BlockTimerContext.Provider>
  );
};

export const useBlockTimer = () => {
  const context = useContext(BlockTimerContext);
  if (!context) {
    throw new Error('useBlockTimer must be used within a BlockTimerProvider');
  }
  return context;
};

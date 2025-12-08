
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
  playBell: () => void;
}

// Boxing ring bell sound using Web Audio API
const playBoxingBell = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(800, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
      
      gain2.gain.setValueAtTime(0.8, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      osc2.type = 'sine';
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 1);
    }, 200);
  } catch (e) {
    console.log('Could not play bell sound:', e);
  }
};

const BlockTimerContext = createContext<BlockTimerContextType | null>(null);

export const BlockTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blockStates, setBlockStates] = useState<Record<string, BlockTimerState>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Global timer that runs in the context - continues even when components unmount
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setBlockStates(prev => {
        const newStates = { ...prev };
        let hasChanges = false;
        
        Object.keys(newStates).forEach(blockId => {
          const state = newStates[blockId];
          if (state.timerActive && state.remainingSeconds > 0) {
            hasChanges = true;
            const newRemaining = state.remainingSeconds - 1;
            
            if (newRemaining <= 0) {
              // Timer finished
              newStates[blockId] = {
                ...state,
                remainingSeconds: 0,
                timerActive: false
              };
              // Play bell when timer finishes
              playBoxingBell();
            } else {
              newStates[blockId] = {
                ...state,
                remainingSeconds: newRemaining
              };
            }
          }
        });
        
        return hasChanges ? newStates : prev;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
    setBlockStates({});
  }, []);

  const playBell = useCallback(() => {
    playBoxingBell();
  }, []);

  return (
    <BlockTimerContext.Provider value={{
      getBlockState,
      setBlockTimer,
      setBlockSets,
      initializeBlock,
      clearAllStates,
      playBell
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

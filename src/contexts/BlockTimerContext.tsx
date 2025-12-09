
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

// Coach whistle sound using Web Audio API
const playWhistle = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First whistle blow
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    // Whistle frequency (high pitch like a real whistle)
    oscillator1.frequency.setValueAtTime(2800, audioContext.currentTime);
    oscillator1.frequency.linearRampToValueAtTime(2600, audioContext.currentTime + 0.15);
    oscillator1.frequency.linearRampToValueAtTime(2800, audioContext.currentTime + 0.3);
    
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode1.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.02);
    gainNode1.gain.setValueAtTime(0.6, audioContext.currentTime + 0.25);
    gainNode1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.35);
    
    oscillator1.type = 'sine';
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.35);
    
    // Second short whistle blow
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(2800, audioContext.currentTime);
      osc2.frequency.linearRampToValueAtTime(2500, audioContext.currentTime + 0.1);
      
      gain2.gain.setValueAtTime(0, audioContext.currentTime);
      gain2.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.02);
      gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
      
      osc2.type = 'sine';
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.15);
    }, 400);
  } catch (e) {
    console.log('Could not play whistle sound:', e);
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
              playWhistle();
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
    playWhistle();
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

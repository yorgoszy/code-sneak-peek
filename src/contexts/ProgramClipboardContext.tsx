
import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Block, Day } from '@/components/programs/types';

interface ClipboardData {
  type: 'block' | 'day';
  data: Block | Day;
  timestamp: number;
}

interface ProgramClipboardContextType {
  clipboard: ClipboardData | null;
  copyBlock: (block: Block) => void;
  copyDay: (day: Day) => void;
  paste: () => ClipboardData | null;
  hasBlock: () => boolean;
  hasDay: () => boolean;
  clearClipboard: () => void;
}

const ProgramClipboardContext = createContext<ProgramClipboardContextType | undefined>(undefined);

const STORAGE_KEY = 'program_clipboard';

export const ProgramClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Expire clipboard after 1 hour
        if (Date.now() - parsed.timestamp < 3600000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const saveToStorage = useCallback((data: ClipboardData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, []);

  const copyBlock = useCallback((block: Block) => {
    // Deep clone block with all exercises
    const clonedBlock: Block = JSON.parse(JSON.stringify(block));
    const data: ClipboardData = {
      type: 'block',
      data: clonedBlock,
      timestamp: Date.now()
    };
    setClipboard(data);
    saveToStorage(data);
    toast.success('Block αντιγράφηκε στο clipboard');
  }, [saveToStorage]);

  const copyDay = useCallback((day: Day) => {
    // Deep clone day with all blocks and exercises
    const clonedDay: Day = JSON.parse(JSON.stringify(day));
    const data: ClipboardData = {
      type: 'day',
      data: clonedDay,
      timestamp: Date.now()
    };
    setClipboard(data);
    saveToStorage(data);
    toast.success('Ημέρα αντιγράφηκε στο clipboard');
  }, [saveToStorage]);

  const paste = useCallback(() => {
    if (clipboard) {
      // Return deep clone to avoid mutations
      return {
        ...clipboard,
        data: JSON.parse(JSON.stringify(clipboard.data))
      };
    }
    return null;
  }, [clipboard]);

  const hasBlock = useCallback(() => {
    return clipboard?.type === 'block';
  }, [clipboard]);

  const hasDay = useCallback(() => {
    return clipboard?.type === 'day';
  }, [clipboard]);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ProgramClipboardContext.Provider value={{
      clipboard,
      copyBlock,
      copyDay,
      paste,
      hasBlock,
      hasDay,
      clearClipboard
    }}>
      {children}
    </ProgramClipboardContext.Provider>
  );
};

export const useProgramClipboard = () => {
  const context = useContext(ProgramClipboardContext);
  if (!context) {
    throw new Error('useProgramClipboard must be used within ProgramClipboardProvider');
  }
  return context;
};

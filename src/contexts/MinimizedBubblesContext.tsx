import React, { createContext, useContext, useState, useCallback } from 'react';
import { MinimizedWorkoutBubble } from '@/components/active-programs/calendar/MinimizedWorkoutBubble';

interface MinimizedBubble {
  id: string;
  athleteName: string;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  workoutInProgress: boolean;
  elapsedTime: number;
  onRestore: () => void;
}

interface MinimizedBubblesContextType {
  addBubble: (bubble: MinimizedBubble) => void;
  removeBubble: (id: string) => void;
  updateBubble: (id: string, updates: Partial<MinimizedBubble>) => void;
  bubbles: MinimizedBubble[];
  setSuppressRender: (suppress: boolean) => void;
}

const MinimizedBubblesContext = createContext<MinimizedBubblesContextType | null>(null);

export const useMinimizedBubbles = () => {
  const ctx = useContext(MinimizedBubblesContext);
  if (!ctx) {
    // Return no-op if not wrapped in provider (graceful fallback)
    return {
      addBubble: () => {},
      removeBubble: () => {},
      updateBubble: () => {},
      bubbles: [],
      setSuppressRender: () => {},
    };
  }
  return ctx;
};

export const MinimizedBubblesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bubbles, setBubbles] = useState<MinimizedBubble[]>([]);
  const [suppressRender, setSuppressRender] = useState(false);

  const addBubble = useCallback((bubble: MinimizedBubble) => {
    setBubbles(prev => {
      if (prev.some(b => b.id === bubble.id)) return prev;
      return [...prev, bubble];
    });
  }, []);

  const removeBubble = useCallback((id: string) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBubble = useCallback((id: string, updates: Partial<MinimizedBubble>) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  return (
    <MinimizedBubblesContext.Provider value={{ addBubble, removeBubble, updateBubble, bubbles, setSuppressRender }}>
      {children}
      {/* Render only when not suppressed by external renderer */}
      {!suppressRender && bubbles.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[9999] flex gap-2 items-end">
          {bubbles.map(bubble => (
            <MinimizedWorkoutBubble
              key={bubble.id}
              athleteName={bubble.athleteName}
              avatarUrl={bubble.photoUrl || bubble.avatarUrl}
              workoutInProgress={bubble.workoutInProgress}
              elapsedTime={bubble.elapsedTime}
              onRestore={() => {
                bubble.onRestore();
                removeBubble(bubble.id);
              }}
            />
          ))}
        </div>
      )}
    </MinimizedBubblesContext.Provider>
  );
};

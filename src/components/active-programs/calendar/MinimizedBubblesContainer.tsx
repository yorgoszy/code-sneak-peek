import React, { useState, useRef, useCallback } from 'react';
import { MinimizedWorkoutBubble } from './MinimizedWorkoutBubble';

interface BubbleItem {
  id: string;
  athleteName: string;
  avatarUrl?: string | null;
  workoutInProgress: boolean;
  elapsedTime: number;
}

interface MinimizedBubblesContainerProps {
  bubbles: BubbleItem[];
  onRestore: (id: string) => void;
}

export const MinimizedBubblesContainer: React.FC<MinimizedBubblesContainerProps> = ({
  bubbles,
  onRestore,
}) => {
  const [position, setPosition] = useState({ x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const hasMoved = useRef(false);
  const clickedId = useRef<string | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    setIsDragging(true);
    hasMoved.current = false;
    clickedId.current = id;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;

    const newX = Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startPosY + dy));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (!hasMoved.current && clickedId.current) {
      onRestore(clickedId.current);
    }
    dragRef.current = null;
    clickedId.current = null;
  }, [onRestore]);

  if (bubbles.length === 0) return null;

  return (
    <div
      className="fixed z-[9999] select-none touch-none flex gap-2"
      style={{ left: position.x, top: position.y }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          onPointerDown={(e) => handlePointerDown(e, bubble.id)}
        >
          <MinimizedWorkoutBubble
            athleteName={bubble.athleteName}
            avatarUrl={bubble.avatarUrl}
            workoutInProgress={bubble.workoutInProgress}
            elapsedTime={bubble.elapsedTime}
            onRestore={() => {}} // handled by container pointer events
          />
        </div>
      ))}
    </div>
  );
};

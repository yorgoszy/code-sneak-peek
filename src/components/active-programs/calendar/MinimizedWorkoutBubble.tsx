import React, { useState, useRef, useCallback } from 'react';
import { Play, Dumbbell } from 'lucide-react';
import { WorkoutTimer } from './WorkoutTimer';

interface MinimizedWorkoutBubbleProps {
  athleteName: string;
  workoutInProgress: boolean;
  elapsedTime: number;
  onRestore: () => void;
}

export const MinimizedWorkoutBubble: React.FC<MinimizedWorkoutBubbleProps> = ({
  athleteName,
  workoutInProgress,
  elapsedTime,
  onRestore,
}) => {
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const hasMoved = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;

    const newX = Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startPosY + dy));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    if (!hasMoved.current) {
      onRestore();
    }
    dragRef.current = null;
  }, [onRestore]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[9999] select-none touch-none"
      style={{ left: position.x, top: position.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-none shadow-lg border border-gray-300 cursor-pointer
        ${workoutInProgress ? 'bg-[#00ffba] text-black' : 'bg-gray-900 text-white'}
        transition-shadow hover:shadow-xl
      `}>
        <Dumbbell className="w-4 h-4 flex-shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold truncate max-w-[120px]">{athleteName}</span>
          {workoutInProgress && (
            <span className="text-[10px] font-mono">{formatTime(elapsedTime)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

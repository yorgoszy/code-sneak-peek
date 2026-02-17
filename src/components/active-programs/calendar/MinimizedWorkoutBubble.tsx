import React, { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MinimizedWorkoutBubbleProps {
  athleteName: string;
  avatarUrl?: string | null;
  workoutInProgress: boolean;
  elapsedTime: number;
  onRestore: () => void;
  /** When true, renders as fixed-position draggable element (standalone mode) */
  standalone?: boolean;
  /** Size variant: 'sm' (default, w-10), 'lg' (w-14, active dialog) */
  size?: 'sm' | 'lg';
}

export const MinimizedWorkoutBubble: React.FC<MinimizedWorkoutBubbleProps> = ({
  athleteName,
  avatarUrl,
  workoutInProgress,
  elapsedTime,
  onRestore,
  standalone = false,
  size = 'sm',
}) => {
  const [position, setPosition] = useState({ x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const hasMoved = useRef(false);

  const initials = athleteName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!standalone) return;
    setIsDragging(true);
    hasMoved.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [position, standalone]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startPosX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startPosY + dy)),
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!standalone) return;
    setIsDragging(false);
    if (!hasMoved.current) onRestore();
    dragRef.current = null;
  }, [onRestore, standalone]);

  const handleClick = () => {
    if (!standalone) onRestore();
  };

  const sizeClass = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';

  const bubble = (
    <div
      className="relative cursor-pointer group"
      onClick={handleClick}
      title={athleteName}
    >
      <Avatar className={`${sizeClass} border-2 shadow-lg transition-all hover:scale-110 ${
        workoutInProgress ? 'border-[#00ffba]' : 'border-gray-400'
      }`}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={athleteName} /> : null}
        <AvatarFallback className={`text-xs font-bold ${
          workoutInProgress ? 'bg-[#00ffba]/20 text-black' : 'bg-gray-200 text-gray-700'
        }`}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {workoutInProgress && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black text-[#00ffba] text-[8px] font-mono px-1 rounded-sm whitespace-nowrap">
          {formatTime(elapsedTime)}
        </span>
      )}

      {workoutInProgress && (
        <span className="absolute inset-0 rounded-full border-2 border-[#00ffba] animate-ping opacity-30 pointer-events-none" />
      )}
    </div>
  );

  if (standalone) {
    return (
      <div
        className="fixed z-[9999] select-none touch-none"
        style={{ left: position.x, top: position.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {bubble}
      </div>
    );
  }

  return bubble;
};

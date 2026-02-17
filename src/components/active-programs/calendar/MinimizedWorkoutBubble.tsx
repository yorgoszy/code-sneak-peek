import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MinimizedWorkoutBubbleProps {
  athleteName: string;
  avatarUrl?: string | null;
  workoutInProgress: boolean;
  elapsedTime: number;
  onRestore: () => void;
}

export const MinimizedWorkoutBubble: React.FC<MinimizedWorkoutBubbleProps> = ({
  athleteName,
  avatarUrl,
  workoutInProgress,
  elapsedTime,
  onRestore,
}) => {
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

  return (
    <div
      className="relative cursor-pointer group"
      onClick={onRestore}
      title={athleteName}
    >
      <Avatar className={`w-12 h-12 border-2 shadow-lg transition-transform hover:scale-110 ${
        workoutInProgress ? 'border-[#00ffba]' : 'border-gray-400'
      }`}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={athleteName} />
        ) : null}
        <AvatarFallback className={`text-xs font-bold ${
          workoutInProgress ? 'bg-[#00ffba]/20 text-black' : 'bg-gray-200 text-gray-700'
        }`}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Timer badge */}
      {workoutInProgress && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black text-[#00ffba] text-[8px] font-mono px-1 rounded-sm whitespace-nowrap">
          {formatTime(elapsedTime)}
        </span>
      )}

      {/* Pulse ring when workout in progress */}
      {workoutInProgress && (
        <span className="absolute inset-0 rounded-full border-2 border-[#00ffba] animate-ping opacity-30 pointer-events-none" />
      )}
    </div>
  );
};

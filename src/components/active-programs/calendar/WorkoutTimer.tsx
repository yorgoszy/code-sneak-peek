
import React from 'react';
import { Clock } from 'lucide-react';

interface WorkoutTimerProps {
  workoutInProgress: boolean;
  elapsedTime: number;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  workoutInProgress,
  elapsedTime
}) => {
  if (!workoutInProgress) return null;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-[#00ffba]/10 text-[#00ffba] px-3 py-1 rounded-none">
      <Clock className="w-4 h-4" />
      <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
    </div>
  );
};

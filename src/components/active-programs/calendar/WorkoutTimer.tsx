
import React from 'react';

interface WorkoutTimerProps {
  workoutInProgress: boolean;
  elapsedTime: number;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  workoutInProgress,
  elapsedTime
}) => {
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!workoutInProgress) return null;

  return (
    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-none text-sm font-mono">
      ⏱️ {formatElapsedTime(elapsedTime)}
    </div>
  );
};

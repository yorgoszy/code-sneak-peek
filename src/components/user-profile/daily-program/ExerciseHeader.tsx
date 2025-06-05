
import React from 'react';
import { VideoThumbnail } from './VideoThumbnail';

interface ExerciseHeaderProps {
  exercise: {
    id: string;
    sets: number;
    exercises?: {
      name: string;
      video_url?: string;
    };
  };
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  isComplete,
  remainingText,
  onExerciseClick,
  onVideoClick
}) => {
  return (
    <div 
      className={`flex items-center gap-2 p-1 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isComplete ? 'bg-green-50' : ''}`}
      onClick={(e) => onExerciseClick(exercise, e)}
    >
      <div className="flex items-center flex-1 min-w-0">
        <VideoThumbnail exercise={exercise} onVideoClick={onVideoClick} />
        <h6 className={`text-xs font-medium truncate ${
          isComplete ? 'text-green-800' : 'text-gray-900'
        }`}>
          {exercise.exercises?.name || 'Άγνωστη άσκηση'}
        </h6>
      </div>
    </div>
  );
};

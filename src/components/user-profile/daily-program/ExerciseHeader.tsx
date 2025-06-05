
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
  const handleVideoClick = (exerciseData: any) => {
    console.log('🎬 ExerciseHeader video click:', exerciseData.exercises?.name);
    onVideoClick(exerciseData);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Αν κλικάραμε στο video thumbnail, μην καλέσουμε το onExerciseClick
    if ((e.target as HTMLElement).closest('.video-thumbnail')) {
      return;
    }
    onExerciseClick(exercise, e);
  };

  return (
    <div 
      className={`flex items-center gap-2 p-1 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isComplete ? 'bg-green-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <VideoThumbnail 
          exercise={exercise} 
          onVideoClick={handleVideoClick} 
        />
        <h6 className={`text-xs font-medium truncate ${
          isComplete ? 'text-green-800' : 'text-gray-900'
        }`}>
          {exercise.exercises?.name || 'Άγνωστη άσκηση'}
        </h6>
      </div>
      {remainingText && (
        <span className={`text-xs ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
          {remainingText}
        </span>
      )}
    </div>
  );
};

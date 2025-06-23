
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
  viewOnly?: boolean;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  isComplete,
  remainingText,
  onExerciseClick,
  onVideoClick,
  viewOnly = false
}) => {
  console.log('📋 ExerciseHeader render:', {
    exerciseName: exercise.exercises?.name,
    viewOnly: viewOnly,
    hasVideoUrl: !!exercise.exercises?.video_url
  });

  const handleVideoClick = (exerciseData: any) => {
    console.log('🎬 ExerciseHeader video click received:', exerciseData.exercises?.name);
    onVideoClick(exerciseData);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🎯 ExerciseHeader name click detected');
    onVideoClick(exercise);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Αν κλικάραμε στο video thumbnail ή στο όνομα, μην κάνουμε τίποτα
    if ((e.target as HTMLElement).closest('.video-thumbnail') || 
        (e.target as HTMLElement).closest('.exercise-name-clickable')) {
      return;
    }
    
    // Για οποιοδήποτε άλλο κλικ, καλούμε το onExerciseClick
    console.log('🖱️ ExerciseHeader container click - calling exercise click');
    onExerciseClick(exercise, e);
  };

  return (
    <div 
      className={`flex items-center gap-2 p-1 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isComplete ? 'bg-green-50' : ''}`}
      onClick={handleContainerClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <VideoThumbnail 
          exercise={exercise} 
          onVideoClick={handleVideoClick} 
        />
        <h6 
          className={`exercise-name-clickable text-xs font-medium truncate cursor-pointer hover:text-blue-600 ${
            isComplete ? 'text-green-800' : 'text-gray-900'
          }`}
          onClick={handleNameClick}
        >
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

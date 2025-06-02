
import React from 'react';
import { isValidVideoUrl } from '@/utils/videoUtils';

interface ExerciseInteractionHandlerProps {
  workoutInProgress: boolean;
  onVideoClick: (exercise: any) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const ExerciseInteractionHandler: React.FC<ExerciseInteractionHandlerProps> = ({
  workoutInProgress,
  onVideoClick,
  onSetClick,
  children
}) => {
  const handleExerciseClick = (exercise: any, event: React.MouseEvent) => {
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
        onVideoClick(exercise);
      }
      return;
    }
  };

  const handleSetClick = (exerciseId: string, totalSets: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    onSetClick(exerciseId, totalSets, event);
  };

  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onExerciseClick: handleExerciseClick,
            onSetClick: handleSetClick
          } as any);
        }
        return child;
      })}
    </div>
  );
};

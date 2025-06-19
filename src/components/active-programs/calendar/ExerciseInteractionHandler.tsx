
import React from 'react';

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
    console.log('🎯 ExerciseInteractionHandler - Exercise clicked:', exercise.exercises?.name);
    console.log('🏃 ExerciseInteractionHandler - Workout in progress:', workoutInProgress);
    
    if (!workoutInProgress) {
      console.log('⚠️ ExerciseInteractionHandler - Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    // Αν το κλικ ήταν στο video thumbnail, χειρίσου το ως video click
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      console.log('🎥 ExerciseInteractionHandler - Click was on video thumbnail');
      onVideoClick(exercise);
      return;
    }

    // ΑΛΛΑΓΗ: Πάντα καλούμε το onVideoClick όταν έχουμε ενεργή προπόνηση
    console.log('🎬 ExerciseInteractionHandler - Opening video dialog for exercise during workout');
    onVideoClick(exercise);
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

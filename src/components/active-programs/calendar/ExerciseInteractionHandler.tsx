
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
    console.log('🎯 ExerciseInteractionHandler - Exercise clicked:', exercise.exercises?.name);
    console.log('🏃 ExerciseInteractionHandler - Workout in progress:', workoutInProgress);
    
    if (!workoutInProgress) {
      console.log('⚠️ ExerciseInteractionHandler - Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    // Αν το κλικ ήταν στο video thumbnail, χειρίσου το ως video click
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      console.log('🎥 ExerciseInteractionHandler - Click was on video thumbnail');
      if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
        console.log('✅ ExerciseInteractionHandler - Valid video URL found, calling onVideoClick');
        onVideoClick(exercise);
      } else {
        console.log('❌ ExerciseInteractionHandler - No valid video URL');
      }
      return;
    }

    // Αν έχουμε ενεργή προπόνηση και δεν κάναμε κλικ στο video, εμφάνισε το video
    console.log('🎬 ExerciseInteractionHandler - Opening video for exercise during workout');
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      console.log('✅ ExerciseInteractionHandler - Valid video URL found, calling onVideoClick');
      onVideoClick(exercise);
    } else {
      console.log('❌ ExerciseInteractionHandler - No valid video URL');
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


import React from 'react';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetailsGrid } from './ExerciseDetailsGrid';

interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg?: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: {
    id: string;
    name: string;
    description?: string;
    video_url?: string;
  };
}

interface ExerciseItemProps {
  exercise: Exercise;
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: Exercise, event: React.MouseEvent) => void;
  onVideoClick: (exercise: Exercise) => void;
  viewOnly?: boolean;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  isComplete,
  remainingText,
  onExerciseClick,
  onVideoClick,
  viewOnly = false
}) => {
  console.log('🏋️ ExerciseItem render:', {
    exerciseName: exercise.exercises?.name,
    viewOnly: viewOnly,
    hasVideo: !!exercise.exercises?.video_url
  });

  const handleExerciseClick = (exerciseData: Exercise, event: React.MouseEvent) => {
    console.log('🎯 ExerciseItem - Exercise click handler called');
    onExerciseClick(exerciseData, event);
  };

  const handleVideoClick = (exerciseData: Exercise) => {
    console.log('🎬 ExerciseItem - Video click handler called');
    onVideoClick(exerciseData);
  };

  return (
    <div className="bg-white rounded-none">
      <ExerciseHeader
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
        onExerciseClick={handleExerciseClick}
        onVideoClick={handleVideoClick}
        viewOnly={viewOnly}
      />
      <ExerciseDetailsGrid
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
      />
    </div>
  );
};

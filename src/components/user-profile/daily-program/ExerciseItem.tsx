
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
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  isComplete,
  remainingText,
  onExerciseClick,
  onVideoClick
}) => {
  return (
    <div className="bg-white rounded-none">
      <ExerciseHeader
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
        onExerciseClick={onExerciseClick}
        onVideoClick={onVideoClick}
      />
      <ExerciseDetailsGrid
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
      />
    </div>
  );
};


import React from 'react';
import { ExerciseItem } from './ExerciseItem';

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

interface Block {
  id: string;
  name: string;
  block_order: number;
  training_type?: string;
  workout_format?: string;
  workout_duration?: string;
  program_exercises: Exercise[];
}

interface SingleBlockProps {
  block: Block;
  viewOnly: boolean;
  getRemainingText: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: Exercise, event: React.MouseEvent) => void;
  onVideoClick: (exercise: Exercise) => void;
}

export const SingleBlock: React.FC<SingleBlockProps> = ({
  block,
  viewOnly,
  getRemainingText,
  isExerciseComplete,
  onExerciseClick,
  onVideoClick
}) => {
  console.log('🔲 SingleBlock render:', {
    blockName: block.name,
    viewOnly: viewOnly,
    exerciseCount: block.program_exercises?.length || 0
  });
  
  return (
    <div className="bg-gray-700 rounded-none p-2 mb-1">
      <h6 className="text-xs font-medium text-white mb-1">
        {block.name}
      </h6>
      
      <div className="space-y-0">
        {block.program_exercises
          ?.sort((a, b) => a.exercise_order - b.exercise_order)
          .map((exercise) => {
            const remainingText = viewOnly ? '' : getRemainingText(exercise.id, exercise.sets);
            const isComplete = viewOnly ? false : isExerciseComplete(exercise.id, exercise.sets);
            
            console.log('🏋️ SingleBlock rendering exercise:', {
              exerciseName: exercise.exercises?.name,
              hasVideo: !!exercise.exercises?.video_url,
              videoUrl: exercise.exercises?.video_url
            });
            
            return (
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
                isComplete={isComplete}
                remainingText={remainingText}
                onExerciseClick={onExerciseClick}
                onVideoClick={onVideoClick}
                viewOnly={viewOnly}
              />
            );
          })}
      </div>
    </div>
  );
};

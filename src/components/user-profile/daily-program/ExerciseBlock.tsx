
import React from 'react';

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
  };
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: Exercise[];
}

interface ExerciseBlockProps {
  block: Block;
}

export const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ block }) => {
  return (
    <div className="border border-gray-100 rounded-none p-4">
      <h5 className="font-medium text-gray-800 mb-3">
        {block.name}
      </h5>
      
      <div className="space-y-2">
        {block.program_exercises
          .sort((a, b) => a.exercise_order - b.exercise_order)
          .map((exercise) => (
            <div key={exercise.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{exercise.sets} sets</span>
                <span>{exercise.reps} reps</span>
                {exercise.kg && <span>{exercise.kg} kg</span>}
                {exercise.percentage_1rm && <span>{exercise.percentage_1rm}% 1RM</span>}
                {exercise.rest && <span>Ανάπαυση: {exercise.rest}</span>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};


import React from 'react';
import { ExerciseItem } from './ExerciseItem';

interface ProgramBlocksProps {
  blocks: any[];
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: number) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const ProgramBlocks: React.FC<ProgramBlocksProps> = ({
  blocks,
  workoutInProgress,
  getRemainingText,
  isExerciseComplete,
  onExerciseClick,
  onSetClick,
  onVideoClick,
  getNotes,
  updateNotes,
  clearNotes,
  updateKg,
  clearKg,
  updateVelocity,
  clearVelocity,
  updateReps,
  clearReps,
  selectedDate,
  program
}) => {
  if (!blocks || blocks.length === 0) {
    return <div className="text-sm text-gray-500">Δεν βρέθηκαν ασκήσεις</div>;
  }

  return (
    <div className="space-y-4">
      {blocks.map(block => (
        <div key={block.id} className="space-y-2">
          {block.name && (
            <div className="text-sm font-medium text-gray-900">{block.name}</div>
          )}

          <div className="space-y-2">
            {block.program_exercises?.sort((a: any, b: any) => 
              a.exercise_order - b.exercise_order
            ).map((exercise: any) => {
              const remainingText = getRemainingText(exercise.id, exercise.sets);
              const isComplete = isExerciseComplete(exercise.id, exercise.sets);
              
              return (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  workoutInProgress={workoutInProgress}
                  isComplete={isComplete}
                  remainingText={remainingText}
                  onExerciseClick={onExerciseClick}
                  onSetClick={onSetClick}
                  onVideoClick={onVideoClick}
                  getNotes={getNotes}
                  updateNotes={updateNotes}
                  clearNotes={clearNotes}
                  updateKg={updateKg}
                  clearKg={clearKg}
                  updateVelocity={updateVelocity}
                  clearVelocity={clearVelocity}
                  updateReps={updateReps}
                  clearReps={clearReps}
                  selectedDate={selectedDate}
                  program={program}
                  getRemainingText={getRemainingText}
                  isExerciseComplete={isExerciseComplete}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

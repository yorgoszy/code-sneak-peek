
import React from 'react';
import { ExerciseItem } from './ExerciseItem';

interface ProgramBlocksProps {
  blocks: any[];
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: string) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: string) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate: Date;
  program: any;
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
    return (
      <div className="text-center py-4 text-gray-500">
        Δεν υπάρχουν blocks για αυτή την ημέρα
      </div>
    );
  }

  // 🚨 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Ταξινόμηση blocks με βάση block_order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = Number(a.block_order) || 0;
    const orderB = Number(b.block_order) || 0;
    return orderA - orderB;
  });

  console.log('🔧 ProgramBlocks: Rendering blocks with correct order:', 
    sortedBlocks.map(b => ({ name: b.name, order: b.block_order }))
  );

  return (
    <div className="space-y-4">
      {sortedBlocks.map((block, blockIndex) => {
        // 🚨 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Ταξινόμηση ασκήσεων με βάση exercise_order
        const sortedExercises = [...(block.program_exercises || [])].sort((a, b) => {
          const orderA = Number(a.exercise_order) || 0;
          const orderB = Number(b.exercise_order) || 0;
          console.log(`🔧 ProgramBlocks: Sorting exercises: ${a.exercises?.name} (${orderA}) vs ${b.exercises?.name} (${orderB})`);
          return orderA - orderB;
        });

        console.log(`🔧 ProgramBlocks: Block "${block.name}" final exercise order:`, 
          sortedExercises.map((ex, idx) => `${idx + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`)
        );

        return (
          <div key={block.id} className="bg-white border border-gray-200 rounded-none">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">{block.name}</h4>
            </div>
            <div className="p-4 space-y-3">
              {sortedExercises.map((exercise, exerciseIndex) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  exerciseNumber={exerciseIndex + 1}
                  workoutInProgress={workoutInProgress}
                  getRemainingText={getRemainingText}
                  isExerciseComplete={isExerciseComplete}
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
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

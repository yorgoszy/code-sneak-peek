
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  clearReps
}) => {
  if (!blocks || blocks.length === 0) return null;

  const renderExercises = (exercises: any[]) => {
    return exercises
      ?.sort((a: any, b: any) => a.exercise_order - b.exercise_order)
      .map((exercise: any) => {
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
          />
        );
      });
  };

  // Αν έχουμε μόνο ένα block, το εμφανίζουμε χωρίς tabs
  if (blocks.length === 1) {
    const block = blocks[0];
    return (
      <div className="bg-gray-700 rounded-none p-2 mb-1">
        <h6 className="text-xs font-medium text-white mb-1">
          {block.name}
        </h6>
        
        <div className="space-y-0">
          {renderExercises(block.program_exercises)}
        </div>
      </div>
    );
  }

  // Αν έχουμε πολλαπλά blocks, τα εμφανίζουμε ως tabs
  return (
    <Tabs defaultValue={blocks[0]?.id} className="w-full">
      <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${blocks.length}, 1fr)` }}>
        {blocks
          .sort((a, b) => a.block_order - b.block_order)
          .map((block) => (
            <TabsTrigger key={block.id} value={block.id} className="rounded-none text-xs">
              {block.name}
            </TabsTrigger>
          ))}
      </TabsList>
      
      {blocks.map((block) => (
        <TabsContent key={block.id} value={block.id} className="mt-2">
          <div className="space-y-0">
            {renderExercises(block.program_exercises)}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};


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
    return (
      <div className="bg-white border border-gray-200 rounded-none p-6 text-center text-gray-500">
        Δεν υπάρχουν blocks για αυτή την ημέρα
      </div>
    );
  }

  // Αν έχουμε μόνο ένα block, το εμφανίζουμε απλά χωρίς tabs
  if (blocks.length === 1) {
    const block = blocks[0];
    return (
      <div className="bg-gray-50 rounded-none border border-gray-200 p-3">
        <h5 className="text-sm font-semibold text-gray-800 mb-2">
          {block.name}
        </h5>
        
        <div className="space-y-2">
          {block.program_exercises?.map((exercise: any) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              workoutInProgress={workoutInProgress}
              isComplete={isExerciseComplete(exercise.id, exercise.sets)}
              remainingText={getRemainingText(exercise.id, exercise.sets)}
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
  }

  // Αν έχουμε πολλά blocks, τα εμφανίζουμε ως tabs
  return (
    <Tabs defaultValue={blocks[0]?.id} className="w-full">
      <TabsList className="grid w-full rounded-none" style={{gridTemplateColumns: `repeat(${blocks.length}, 1fr)`}}>
        {blocks.map((block) => (
          <TabsTrigger 
            key={block.id} 
            value={block.id}
            className="rounded-none text-sm"
          >
            {block.name}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {blocks.map((block) => (
        <TabsContent key={block.id} value={block.id} className="mt-3">
          <div className="bg-gray-50 rounded-none border border-gray-200 p-3">
            <div className="space-y-2">
              {block.program_exercises?.map((exercise: any) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  workoutInProgress={workoutInProgress}
                  isComplete={isExerciseComplete(exercise.id, exercise.sets)}
                  remainingText={getRemainingText(exercise.id, exercise.sets)}
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
        </TabsContent>
      ))}
    </Tabs>
  );
};

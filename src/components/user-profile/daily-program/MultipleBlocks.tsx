
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ExerciseItem } from './ExerciseItem';
import { EditableExerciseRow } from './EditableExerciseRow';
import { ExerciseSelector } from '@/components/active-programs/calendar/ExerciseSelector';
import { getTrainingTypeLabel } from '@/utils/trainingTypeLabels';

interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  reps_mode?: string;
  kg?: string;
  kg_mode?: string;
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
  block_sets?: number;
  program_exercises: Exercise[];
}

interface MultipleBlocksProps {
  blocks: Block[];
  viewOnly: boolean;
  editMode?: boolean;
  getRemainingText: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: Exercise, event: React.MouseEvent) => void;
  onVideoClick: (exercise: Exercise) => void;
  onAddExercise?: (blockId: string, exerciseId: string) => void;
  onRemoveBlock?: (blockId: string) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, field: string, value: any) => void;
}

export const MultipleBlocks: React.FC<MultipleBlocksProps> = ({
  blocks,
  viewOnly,
  editMode = false,
  getRemainingText,
  isExerciseComplete,
  onExerciseClick,
  onVideoClick,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise
}) => {
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = useState<string | null>(null);
  const sortedBlocks = [...blocks].sort((a, b) => a.block_order - b.block_order);

  console.log('📑 MultipleBlocks render:', {
    blockCount: sortedBlocks.length,
    viewOnly: viewOnly,
    editMode: editMode,
    blockNames: sortedBlocks.map(b => b.name),
    blockTypes: sortedBlocks.map(b => b.training_type)
  });

  const handleSelectExercise = (blockId: string, exerciseId: string) => {
    if (onAddExercise) {
      onAddExercise(blockId, exerciseId);
    }
    setExerciseSelectorOpen(null);
  };

  return (
    <Tabs defaultValue={sortedBlocks[0]?.id} className="w-full">
      <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${sortedBlocks.length}, 1fr)` }}>
        {sortedBlocks.map((block) => (
          <TabsTrigger key={block.id} value={block.id} className="rounded-none text-xs">
            {getTrainingTypeLabel(block.training_type, block.name)}
          </TabsTrigger>
        ))}
      </TabsList>

      {sortedBlocks.map((block) => (
        <TabsContent key={block.id} value={block.id} className="mt-2">
          {/* Edit Mode Header - Κουμπιά για προσθήκη άσκησης και διαγραφή block */}
          {editMode && (
            <div className="flex items-center justify-between mb-2 p-1 bg-gray-100 border border-gray-200">
              <span className="text-xs font-medium text-gray-700">{block.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExerciseSelectorOpen(block.id)}
                  className="h-6 text-xs rounded-none px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Άσκηση
                </Button>
                {onRemoveBlock && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveBlock(block.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Block Info Header */}
          {(block.workout_format || block.workout_duration || (block.block_sets && block.block_sets > 1)) && (
            <div className="mb-2 flex items-center gap-2">
              {(block.workout_format || block.workout_duration) && (
                <div className="inline-flex items-center gap-2 text-xs border border-[#cb8954] px-2 py-1">
                  {block.workout_format && <span className="text-[#cb8954]">{block.workout_format}</span>}
                  {block.workout_format && block.workout_duration && <span className="text-[#cb8954]">-</span>}
                  {block.workout_duration && <span className="text-[#cb8954]">{block.workout_duration}</span>}
                </div>
              )}
              {block.block_sets && block.block_sets > 1 && (
                <div className="inline-flex items-center text-xs border border-[#cb8954] px-2 py-1">
                  <span className="text-[#cb8954] font-semibold">x{block.block_sets}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-0">
            {block.program_exercises
              ?.sort((a, b) => a.exercise_order - b.exercise_order)
              .map((exercise) => {
                const remainingText = viewOnly ? '' : getRemainingText(exercise.id, exercise.sets);
                const isComplete = viewOnly ? false : isExerciseComplete(exercise.id, exercise.sets);

                console.log('🏋️ MultipleBlocks rendering exercise:', {
                  exerciseName: exercise.exercises?.name,
                  hasVideo: !!exercise.exercises?.video_url,
                  videoUrl: exercise.exercises?.video_url,
                  editMode: editMode
                });

                return (
                  <div key={exercise.id} className="border border-gray-200">
                    {editMode ? (
                      <EditableExerciseRow
                        exercise={exercise}
                        onUpdate={onUpdateExercise ? (field, value) => onUpdateExercise(exercise.id, field, value) : undefined}
                        onRemove={onRemoveExercise ? () => onRemoveExercise(exercise.id) : undefined}
                        onVideoClick={() => onVideoClick(exercise)}
                      />
                    ) : (
                      <ExerciseItem
                        exercise={exercise}
                        isComplete={isComplete}
                        remainingText={remainingText}
                        onExerciseClick={onExerciseClick}
                        onVideoClick={onVideoClick}
                        viewOnly={viewOnly}
                      />
                    )}
                  </div>
                );
              })}
          </div>

          {/* Exercise Selector για αυτό το block */}
          <ExerciseSelector
            isOpen={exerciseSelectorOpen === block.id}
            onClose={() => setExerciseSelectorOpen(null)}
            onSelectExercise={(exerciseId) => handleSelectExercise(block.id, exerciseId)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

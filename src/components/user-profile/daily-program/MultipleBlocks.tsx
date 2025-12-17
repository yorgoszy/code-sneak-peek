
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseItem } from './ExerciseItem';
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
  getRemainingText: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: Exercise, event: React.MouseEvent) => void;
  onVideoClick: (exercise: Exercise) => void;
}

export const MultipleBlocks: React.FC<MultipleBlocksProps> = ({
  blocks,
  viewOnly,
  getRemainingText,
  isExerciseComplete,
  onExerciseClick,
  onVideoClick
}) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.block_order - b.block_order);

  console.log('📑 MultipleBlocks render:', {
    blockCount: sortedBlocks.length,
    viewOnly: viewOnly,
    blockNames: sortedBlocks.map(b => b.name),
    blockTypes: sortedBlocks.map(b => b.training_type)
  });

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
                  videoUrl: exercise.exercises?.video_url
                });

                return (
                  <div key={exercise.id} className="border border-gray-200">
                    <ExerciseItem
                      exercise={exercise}
                      isComplete={isComplete}
                      remainingText={remainingText}
                      onExerciseClick={onExerciseClick}
                      onVideoClick={onVideoClick}
                      viewOnly={viewOnly}
                    />
                  </div>
                );
              })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

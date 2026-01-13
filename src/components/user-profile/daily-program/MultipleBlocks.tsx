
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
  onUpdateBlockFormat?: (blockId: string, format: string) => void;
  onUpdateBlockDuration?: (blockId: string, duration: string) => void;
  onUpdateBlockSets?: (blockId: string, sets: number) => void;
}

// Training type colors for tabs
const TRAINING_TYPE_COLORS: Record<string, string> = {
  'pwr': 'bg-orange-200 data-[state=active]:bg-orange-400',
  'power': 'bg-orange-200 data-[state=active]:bg-orange-400',
  'str': 'bg-green-200 data-[state=active]:bg-green-400',
  'end': 'bg-blue-200 data-[state=active]:bg-blue-400',
  'str/end': 'bg-teal-200 data-[state=active]:bg-teal-400',
  'pwr/end': 'bg-cyan-200 data-[state=active]:bg-cyan-400',
  'spd': 'bg-yellow-200 data-[state=active]:bg-yellow-400',
  'spd/str': 'bg-lime-200 data-[state=active]:bg-lime-400',
  'warm up': 'bg-pink-200 data-[state=active]:bg-pink-400',
  'default': 'bg-gray-200 data-[state=active]:bg-gray-400',
};

const getTabColor = (trainingType?: string) => {
  if (!trainingType) return TRAINING_TYPE_COLORS['default'];
  const key = trainingType.toLowerCase();
  return TRAINING_TYPE_COLORS[key] || TRAINING_TYPE_COLORS['default'];
};

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
  onUpdateExercise,
  onUpdateBlockFormat,
  onUpdateBlockDuration,
  onUpdateBlockSets
}) => {
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = useState<string | null>(null);
  const sortedBlocks = [...blocks].sort((a, b) => a.block_order - b.block_order);

  const handleSelectExercise = (blockId: string, exerciseId: string) => {
    if (onAddExercise) {
      onAddExercise(blockId, exerciseId);
    }
    setExerciseSelectorOpen(null);
  };

  return (
    <Tabs defaultValue={sortedBlocks[0]?.id} className="w-full">
      <TabsList className="grid w-full rounded-none h-auto p-0 bg-transparent" style={{ gridTemplateColumns: `repeat(${sortedBlocks.length}, 1fr)` }}>
        {sortedBlocks.map((block) => (
          <TabsTrigger 
            key={block.id} 
            value={block.id} 
            className={`rounded-none text-xs h-7 ${getTabColor(block.training_type)}`}
          >
            {getTrainingTypeLabel(block.training_type, block.name)}
          </TabsTrigger>
        ))}
      </TabsList>

      {sortedBlocks.map((block) => (
        <TabsContent key={block.id} value={block.id} className="mt-0">
          {/* Edit Mode Header - Add exercise and delete block buttons */}
          {editMode && (
            <div className="flex items-center justify-between p-1 bg-gray-100 border border-gray-200">
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
                    style={{ borderRadius: '0px' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Block Info Header - Format, Duration, Sets */}
          {(block.workout_format || block.workout_duration || (block.block_sets && block.block_sets > 1)) && (
            <div className="flex items-center gap-2 p-1 border-b border-gray-200">
              {(block.workout_format || block.workout_duration) && (
                <div className="inline-flex items-center gap-2 text-xs border border-[#cb8954] px-2 py-0.5">
                  {block.workout_format && <span className="text-[#cb8954]">{block.workout_format}</span>}
                  {block.workout_format && block.workout_duration && <span className="text-[#cb8954]">-</span>}
                  {block.workout_duration && <span className="text-[#cb8954]">{block.workout_duration}</span>}
                </div>
              )}
              {block.block_sets && block.block_sets > 1 && (
                <div className="inline-flex items-center text-xs border border-[#cb8954] px-2 py-0.5">
                  <span className="text-[#cb8954] font-semibold">x{block.block_sets}</span>
                </div>
              )}
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-0">
            {block.program_exercises
              ?.sort((a, b) => a.exercise_order - b.exercise_order)
              .map((exercise) => {
                const remainingText = viewOnly ? '' : getRemainingText(exercise.id, exercise.sets);
                const isComplete = viewOnly ? false : isExerciseComplete(exercise.id, exercise.sets);

                return (
                  <div key={exercise.id} className="border border-gray-200 border-t-0 first:border-t">
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

          {/* Exercise Selector Dialog */}
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

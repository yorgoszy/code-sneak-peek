
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  console.log('📑 MultipleBlocks render:', {
    blockCount: blocks.length,
    viewOnly: viewOnly,
    blockNames: blocks.map(b => b.name)
  });
  
  return (
    <Tabs defaultValue={blocks[0]?.id} className="w-full">
      <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${blocks.length}, 1fr)` }}>
        {blocks
          ?.sort((a, b) => a.block_order - b.block_order)
          .map((block) => (
            <TabsTrigger key={block.id} value={block.id} className="rounded-none text-xs">
              {block.name}
            </TabsTrigger>
          ))}
      </TabsList>
      
      {blocks?.map((block) => (
        <TabsContent key={block.id} value={block.id} className="mt-2">
          {/* Block Info Header */}
          {(block.training_type || block.workout_format) && (
            <div className="mb-2 p-2 bg-muted rounded-none border border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {block.training_type && (
                  <span className="font-medium">
                    Type: <span className="text-foreground">{block.training_type}</span>
                  </span>
                )}
                {block.workout_format && (
                  <span className="font-medium">
                    Format: <span className="text-foreground">{block.workout_format}</span>
                  </span>
                )}
                {block.workout_duration && (
                  <span className="font-medium">
                    Duration: <span className="text-foreground">{block.workout_duration}</span>
                  </span>
                )}
              </div>
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

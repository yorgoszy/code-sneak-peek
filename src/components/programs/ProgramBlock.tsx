
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { NewExerciseDialog } from './NewExerciseDialog';
import { Exercise, Block } from './types';

interface ProgramBlockProps {
  block: Block;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSetCurrentBlock: (block: Block) => void;
  showNewExercise: boolean;
  setShowNewExercise: (show: boolean) => void;
  newExercise: any;
  setNewExercise: (exercise: any) => void;
  onCreateExercise: () => void;
  exercises: Exercise[];
}

export const ProgramBlock: React.FC<ProgramBlockProps> = ({
  block,
  onDeleteBlock,
  onDeleteExercise,
  onSetCurrentBlock,
  showNewExercise,
  setShowNewExercise,
  newExercise,
  setNewExercise,
  onCreateExercise,
  exercises
}) => {
  return (
    <Card className="rounded-none border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h5 className="font-medium text-sm">{block.name}</h5>
          <div className="flex gap-1">
            <NewExerciseDialog
              open={showNewExercise}
              onOpenChange={setShowNewExercise}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              exercises={exercises}
              onCreateExercise={onCreateExercise}
              onSetCurrentBlock={() => onSetCurrentBlock(block)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteBlock(block.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {block.program_exercises?.map(exercise => (
            <div key={exercise.id} className="text-xs p-2 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">
                    {exercise.exercises?.name}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {exercise.sets} sets × {exercise.reps} reps
                    {exercise.kg && ` @ ${exercise.kg}kg`}
                    {exercise.percentage_1rm && ` (${exercise.percentage_1rm}%1RM)`}
                    {exercise.velocity_ms && ` @ ${exercise.velocity_ms}m/s`}
                  </div>
                  {exercise.tempo && (
                    <div className="text-gray-500">Tempo: {exercise.tempo}</div>
                  )}
                  {exercise.rest && (
                    <div className="text-gray-500">Rest: {exercise.rest}</div>
                  )}
                  {exercise.notes && (
                    <div className="text-gray-500 italic">{exercise.notes}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteExercise(exercise.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

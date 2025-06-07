
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Copy, GripVertical } from "lucide-react";
import { ExerciseRow } from './ExerciseRow';
import { Exercise, Block } from '../types';

interface BlockCardProps {
  block: Block;
  exercises: Exercise[];
  allBlockExercises: Block['program_exercises'];
  selectedUserId?: string;
  onUpdateBlockName: (name: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onAddExercise: (exerciseId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (exerciseId: string) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  exercises,
  allBlockExercises,
  selectedUserId,
  onUpdateBlockName,
  onRemoveBlock,
  onDuplicateBlock,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise
}) => {
  return (
    <div className="border border-gray-200 rounded-none bg-white">
      {/* Block Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
        <Input
          value={block.name}
          onChange={(e) => onUpdateBlockName(e.target.value)}
          className="flex-1 text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
          placeholder="Όνομα Block"
          style={{ borderRadius: '0px' }}
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicateBlock}
            className="p-1 h-6 w-6"
            style={{ borderRadius: '0px' }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveBlock}
            className="p-1 h-6 w-6"
            style={{ borderRadius: '0px' }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Exercises */}
      <div className="p-3">
        {block.program_exercises?.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            exercises={exercises}
            allBlockExercises={allBlockExercises}
            selectedUserId={selectedUserId}
            onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
            onRemove={() => onRemoveExercise(exercise.id)}
            onDuplicate={() => onDuplicateExercise(exercise.id)}
          />
        ))}

        <Button
          onClick={() => onAddExercise('')}
          variant="outline"
          size="sm"
          className="w-full mt-2"
          style={{ borderRadius: '0px' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Άσκησης
        </Button>
      </div>
    </div>
  );
};

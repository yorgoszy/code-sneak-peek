
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { Exercise } from '../types';

interface ExerciseSelectionButtonProps {
  selectedExercise: Exercise | undefined;
  exerciseNumber: number | null;
  onSelectExercise: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export const ExerciseSelectionButton: React.FC<ExerciseSelectionButtonProps> = ({
  selectedExercise,
  exerciseNumber,
  onSelectExercise,
  onDuplicate,
  onRemove
}) => {
  return (
    <div className="p-2 border-b bg-gray-50 flex items-center gap-2 w-full" style={{ minHeight: '28px' }}>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 text-sm h-6 justify-start px-2"
        style={{ borderRadius: '0px', fontSize: '12px' }}
        onClick={onSelectExercise}
      >
        {selectedExercise ? (
          <span className="flex items-center gap-1">
            {exerciseNumber && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-sm mr-1">
                {exerciseNumber}
              </span>
            )}
            {selectedExercise.name}
          </span>
        ) : 'Επιλογή...'}
      </Button>
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          className="p-1 h-6 w-6"
          style={{ borderRadius: '0px' }}
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="p-1 h-6 w-6"
          style={{ borderRadius: '0px' }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

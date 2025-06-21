
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { Exercise } from '../types';

interface ExerciseSelectionButtonProps {
  selectedExercise: Exercise | undefined;
  exerciseNumber: number;
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
    <div className="flex items-center justify-between p-2 border-b bg-gray-50">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-medium text-gray-500 flex-shrink-0">
          #{exerciseNumber}
        </span>
        <button
          onClick={onSelectExercise}
          className="text-left text-xs text-blue-600 hover:text-blue-800 truncate flex-1 min-w-0"
          title={selectedExercise?.name || 'Επιλέξτε άσκηση'}
        >
          {selectedExercise?.name || 'Επιλέξτε άσκηση'}
        </button>
      </div>
      
      <div className="flex gap-1 flex-shrink-0 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          className="h-6 w-6 p-0 hover:bg-gray-200"
          title="Αντιγραφή"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
          title="Διαγραφή"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

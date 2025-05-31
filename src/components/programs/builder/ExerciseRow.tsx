
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Exercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface ExerciseRowProps {
  exercise: ProgramExercise;
  exercises: Exercise[];
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  onUpdate,
  onRemove
}) => {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
  };

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);

  return (
    <>
      <div className="grid grid-cols-8 gap-2 p-2 bg-white rounded border text-xs">
        <div className="col-span-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-none text-xs h-8 justify-start"
            onClick={() => setShowExerciseDialog(true)}
          >
            {selectedExercise ? selectedExercise.name : 'Επιλογή...'}
          </Button>
        </div>
        
        <div>
          <Input
            type="number"
            value={exercise.sets}
            onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 1)}
            className="rounded-none text-xs h-8"
            placeholder="Sets"
          />
        </div>
        
        <div>
          <Input
            value={exercise.reps}
            onChange={(e) => onUpdate('reps', e.target.value)}
            className="rounded-none text-xs h-8"
            placeholder="Reps"
          />
        </div>
        
        <div>
          <Input
            value={exercise.kg}
            onChange={(e) => onUpdate('kg', e.target.value)}
            className="rounded-none text-xs h-8"
            placeholder="Kg"
          />
        </div>
        
        <div>
          <Input
            type="number"
            value={exercise.percentage_1rm}
            onChange={(e) => onUpdate('percentage_1rm', parseFloat(e.target.value) || 0)}
            className="rounded-none text-xs h-8"
            placeholder="%1RM"
          />
        </div>
        
        <div>
          <Input
            value={exercise.rest}
            onChange={(e) => onUpdate('rest', e.target.value)}
            className="rounded-none text-xs h-8"
            placeholder="Rest"
          />
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="rounded-none p-1 h-8 w-8"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
      />
    </>
  );
};

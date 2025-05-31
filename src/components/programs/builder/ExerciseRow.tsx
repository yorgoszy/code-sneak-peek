
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy } from "lucide-react";
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
  onDuplicate: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  onUpdate,
  onRemove,
  onDuplicate
}) => {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    setShowExerciseDialog(false);
  };

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);

  return (
    <>
      <div className="bg-white rounded border text-xs">
        {/* Exercise Name Row with Actions */}
        <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-none text-xs h-7 justify-start px-2"
            onClick={() => setShowExerciseDialog(true)}
          >
            {selectedExercise ? selectedExercise.name : 'Επιλογή...'}
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="rounded-none p-1 h-7 w-7"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="rounded-none p-1 h-7 w-7"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Exercise Details Row - 7 columns now instead of 8 */}
        <div className="grid grid-cols-7 gap-1 p-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sets</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.sets}
              onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 1)}
              className="rounded-none text-xs h-8 px-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
              placeholder="1"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-1">Reps</label>
            <Input
              value={exercise.reps}
              onChange={(e) => onUpdate('reps', e.target.value)}
              className="rounded-none text-xs h-8 px-3 text-center w-full"
              placeholder="8-10"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-1">Kg</label>
            <Input
              value={exercise.kg}
              onChange={(e) => onUpdate('kg', e.target.value)}
              className="rounded-none text-xs h-8 px-3 text-center w-full"
              placeholder="80"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-1">%1RM</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={exercise.percentage_1rm}
              onChange={(e) => onUpdate('percentage_1rm', parseFloat(e.target.value) || 0)}
              className="rounded-none text-xs h-8 px-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
              placeholder="80"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-1">Velocity</label>
            <Input
              value={exercise.velocity_ms}
              onChange={(e) => onUpdate('velocity_ms', e.target.value)}
              className="rounded-none text-xs h-8 px-3 text-center w-full"
              placeholder="0.6"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tempo</label>
            <Input
              value={exercise.tempo}
              onChange={(e) => onUpdate('tempo', e.target.value)}
              className="rounded-none text-xs h-8 px-3 text-center w-full"
              placeholder="3110"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-1">Rest</label>
            <Input
              value={exercise.rest}
              onChange={(e) => onUpdate('rest', e.target.value)}
              className="rounded-none text-xs h-8 px-3 text-center w-full"
              placeholder="2'"
            />
          </div>
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

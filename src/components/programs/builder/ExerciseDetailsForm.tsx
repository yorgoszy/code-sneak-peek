
import React from 'react';
import { Input } from "@/components/ui/input";
import { ProgramExercise } from '../types';

interface ExerciseDetailsFormProps {
  exercise: ProgramExercise;
  onUpdate: (field: string, value: any) => void;
  onVelocityChange: (value: string) => void;
  onKgChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
}

export const ExerciseDetailsForm: React.FC<ExerciseDetailsFormProps> = ({
  exercise,
  onUpdate,
  onVelocityChange,
  onKgChange,
  onPercentageChange
}) => {
  return (
    <div className="grid grid-cols-7 gap-1 p-2 text-xs">
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Sets</label>
        <Input
          type="text"
          inputMode="numeric"
          value={exercise.sets || ''}
          onChange={(e) => onUpdate('sets', e.target.value)}
          className="h-7 text-xs rounded-none no-spinners"
          placeholder="Sets"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Reps</label>
        <Input
          type="text"
          inputMode="numeric"
          value={exercise.reps || ''}
          onChange={(e) => onUpdate('reps', e.target.value)}
          className="h-7 text-xs rounded-none no-spinners"
          placeholder="Reps"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">%1RM</label>
        <Input
          type="text"
          inputMode="numeric"
          value={exercise.percentage_1rm || ''}
          onChange={(e) => onPercentageChange(e.target.value)}
          className="h-7 text-xs rounded-none no-spinners"
          placeholder="%"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Kg</label>
        <Input
          type="text"
          inputMode="numeric"
          value={exercise.kg || ''}
          onChange={(e) => onKgChange(e.target.value)}
          className="h-7 text-xs rounded-none no-spinners"
          placeholder="Kg"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">m/s</label>
        <Input
          type="text"
          inputMode="numeric"
          value={exercise.velocity_ms || ''}
          onChange={(e) => onVelocityChange(e.target.value)}
          className="h-7 text-xs rounded-none no-spinners"
          placeholder="m/s"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Tempo</label>
        <Input
          type="text"
          value={exercise.tempo || ''}
          onChange={(e) => onUpdate('tempo', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Tempo"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Rest</label>
        <Input
          type="text"
          value={exercise.rest || ''}
          onChange={(e) => onUpdate('rest', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Rest"
        />
      </div>
    </div>
  );
};

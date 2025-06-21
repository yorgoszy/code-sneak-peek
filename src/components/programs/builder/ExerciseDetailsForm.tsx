
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
    <div className="grid grid-cols-2 md:grid-cols-6 gap-1 p-2 text-xs">
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Sets</label>
        <Input
          type="number"
          value={exercise.sets || ''}
          onChange={(e) => onUpdate('sets', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Sets"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Reps</label>
        <Input
          value={exercise.reps || ''}
          onChange={(e) => onUpdate('reps', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Reps"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Kg</label>
        <Input
          value={exercise.kg || ''}
          onChange={(e) => onKgChange(e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Kg"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">%</label>
        <Input
          value={exercise.percentage || ''}
          onChange={(e) => onPercentageChange(e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="%"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Tempo</label>
        <Input
          value={exercise.tempo || ''}
          onChange={(e) => onUpdate('tempo', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Tempo"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Rest</label>
        <Input
          value={exercise.rest || ''}
          onChange={(e) => onUpdate('rest', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Rest"
        />
      </div>
      
      <div className="space-y-1 col-span-2 md:col-span-3">
        <label className="text-xs text-gray-600">Velocity</label>
        <Input
          value={exercise.velocity || ''}
          onChange={(e) => onVelocityChange(e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Velocity"
        />
      </div>
      
      <div className="space-y-1 col-span-2 md:col-span-3">
        <label className="text-xs text-gray-600">Σημειώσεις</label>
        <Input
          value={exercise.notes || ''}
          onChange={(e) => onUpdate('notes', e.target.value)}
          className="h-7 text-xs rounded-none"
          placeholder="Σημειώσεις"
        />
      </div>
    </div>
  );
};

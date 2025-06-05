
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface ExerciseActualValuesProps {
  exercise: any;
  workoutInProgress: boolean;
  updateReps: (exerciseId: string, reps: number) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
}

export const ExerciseActualValues: React.FC<ExerciseActualValuesProps> = ({
  exercise,
  workoutInProgress,
  updateReps,
  updateKg,
  updateVelocity
}) => {
  const [actualReps, setActualReps] = useState(exercise.reps || '');
  const [actualKg, setActualKg] = useState(exercise.kg || '');
  const [actualVelocity, setActualVelocity] = useState(exercise.velocity_ms || '');
  const [actualRest, setActualRest] = useState(exercise.rest || '');

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    if (workoutInProgress) {
      updateReps(exercise.id, parseInt(value) || 0);
    }
  };

  const handleKgChange = (value: string) => {
    setActualKg(value);
    if (workoutInProgress) {
      updateKg(exercise.id, value);
    }
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    if (workoutInProgress) {
      updateVelocity(exercise.id, parseFloat(value) || 0);
    }
  };

  if (!workoutInProgress) return null;

  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-2">Actual Values</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Actual Reps</label>
          <Input
            type="number"
            value={actualReps}
            onChange={(e) => handleRepsChange(e.target.value)}
            className="h-7 text-xs rounded-none"
            placeholder={exercise.reps || ''}
          />
        </div>
        
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Actual Kg</label>
          <Input
            type="number"
            step="0.5"
            value={actualKg}
            onChange={(e) => handleKgChange(e.target.value)}
            className="h-7 text-xs rounded-none"
            placeholder={exercise.kg || ''}
          />
        </div>
        
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Actual m/s</label>
          <Input
            type="number"
            step="0.01"
            value={actualVelocity}
            onChange={(e) => handleVelocityChange(e.target.value)}
            className="h-7 text-xs rounded-none"
            placeholder={exercise.velocity_ms || ''}
          />
        </div>
        
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Actual Rest (s)</label>
          <Input
            type="number"
            value={actualRest}
            onChange={(e) => setActualRest(e.target.value)}
            className="h-7 text-xs rounded-none"
            placeholder={exercise.rest || ''}
          />
        </div>
      </div>
    </div>
  );
};

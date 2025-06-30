
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';

interface ExerciseActualValuesProps {
  exercise: any;
  workoutInProgress: boolean;
  updateReps: (exerciseId: string, reps: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  updateVelocity: (exerciseId: string, velocity: string) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  selectedDate?: Date;
  program?: any;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  getRemainingText: (exerciseId: string) => string;
}

export const ExerciseActualValues: React.FC<ExerciseActualValuesProps> = ({
  exercise,
  workoutInProgress,
  updateReps,
  updateKg,
  updateVelocity,
  selectedDate,
  program,
  onSetClick,
  getRemainingText
}) => {
  // Get saved data from localStorage
  const savedData = selectedDate && program ? 
    getWorkoutData(selectedDate, program.programs?.id || program.id, exercise.id) : 
    {};

  const handleRepsChange = (value: string) => {
    updateReps(exercise.id, value);
  };

  const handleKgChange = (value: string) => {
    updateKg(exercise.id, value);
  };

  const handleVelocityChange = (value: string) => {
    updateVelocity(exercise.id, value);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress) {
      onSetClick(exercise.id, exercise.sets, event);
    }
  };

  if (!workoutInProgress) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div>
        <label className="text-xs text-gray-600 block mb-1">Actual Reps</label>
        <Input
          type="text"
          placeholder={exercise.reps?.toString() || ''}
          value={savedData.reps || ''}
          onChange={(e) => handleRepsChange(e.target.value)}
          className="h-8 text-xs rounded-none"
        />
      </div>
      
      <div>
        <label className="text-xs text-gray-600 block mb-1">Actual Weight (kg)</label>
        <Input
          type="text"
          placeholder={exercise.kg?.toString() || ''}
          value={savedData.kg || ''}
          onChange={(e) => handleKgChange(e.target.value)}
          className="h-8 text-xs rounded-none"
        />
      </div>
      
      <div>
        <label className="text-xs text-gray-600 block mb-1">Velocity (m/s)</label>
        <Input
          type="text"
          placeholder={exercise.velocity_ms?.toString() || ''}
          value={savedData.velocity || ''}
          onChange={(e) => handleVelocityChange(e.target.value)}
          className="h-8 text-xs rounded-none"
        />
      </div>

      <div className="col-span-3 mt-2">
        <Button
          onClick={handleSetClick}
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs rounded-none"
          disabled={!workoutInProgress}
        >
          Complete Set {getRemainingText(exercise.id)}
        </Button>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { getWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { formatVelocityMs } from '@/utils/timeCalculations';
import { VelocityCameraDialog } from './VelocityCameraDialog';
import { useAuthContext } from '@/contexts/AuthContext';

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

interface WorkoutData {
  exerciseId: string;
  kg?: string;
  reps?: string;
  velocity?: string;
  notes?: string;
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
  // Get saved data from localStorage with proper typing
  const savedData: WorkoutData = selectedDate && program ? 
    getWorkoutData(selectedDate, program.programs?.id || program.id, exercise.id) : 
    { exerciseId: exercise.id };

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

  const { user } = useAuthContext();
  const [cameraOpen, setCameraOpen] = useState(false);

  if (!workoutInProgress) {
    return null;
  }

  const targetUserId = program?.user_id || program?.app_users?.id || user?.id;
  const loadKg = Number(savedData.kg ?? exercise.kg ?? 0) || 0;

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
          placeholder={formatVelocityMs(exercise.velocity_ms) === '-' ? '' : formatVelocityMs(exercise.velocity_ms)}
          value={savedData.velocity || ''}
          onChange={(e) => handleVelocityChange(e.target.value)}
          className="h-8 text-xs rounded-none"
        />
      </div>

      <div className="col-span-3 mt-2 flex gap-2">
        <Button
          onClick={handleSetClick}
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs rounded-none"
          disabled={!workoutInProgress}
        >
          Complete Set {getRemainingText(exercise.id)}
        </Button>
        <Button
          onClick={(e) => { e.stopPropagation(); setCameraOpen(true); }}
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-none"
          title="Track velocity με κάμερα"
        >
          <Camera className="w-3 h-3 mr-1" /> Velocity
        </Button>
      </div>

      {cameraOpen && targetUserId && (
        <VelocityCameraDialog
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          exerciseId={exercise.exercise_id || exercise.exercises?.id || exercise.id}
          exerciseName={exercise.exercises?.name || 'Exercise'}
          userId={targetUserId}
          loadKg={loadKg}
          setNumber={1}
          totalReps={Number(exercise.reps) || 1}
        />
      )}
    </div>
  );
};

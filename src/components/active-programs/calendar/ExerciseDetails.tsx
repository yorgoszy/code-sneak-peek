
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoThumbnail } from '@/components/user-profile/daily-program/VideoThumbnail';
import { getWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';

interface ExerciseDetailsProps {
  exercise: any;
  onVideoClick?: (exercise: any) => void;
  onSetClick?: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  workoutInProgress?: boolean;
  getRemainingText?: (exerciseId: string) => string;
  updateReps?: (exerciseId: string, reps: string) => void;
  updateKg?: (exerciseId: string, kg: string) => void;
  updateVelocity?: (exerciseId: string, velocity: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ 
  exercise, 
  onVideoClick,
  onSetClick,
  workoutInProgress = false,
  getRemainingText,
  updateReps,
  updateKg,
  updateVelocity,
  selectedDate,
  program
}) => {
  const handleSetsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress && onSetClick) {
      onSetClick(exercise.id, exercise.sets, event);
    }
  };

  // Get saved data from localStorage with proper typing
  const savedData: { exerciseId: string; kg?: string; reps?: string; velocity?: string; notes?: string } = selectedDate && program ? 
    getWorkoutData(selectedDate, program.programs?.id || program.id, exercise.id) : 
    { exerciseId: exercise.id };

  const handleRepsChange = (value: string) => {
    if (updateReps) updateReps(exercise.id, value);
  };

  const handleKgChange = (value: string) => {
    if (updateKg) updateKg(exercise.id, value);
  };

  const handleVelocityChange = (value: string) => {
    if (updateVelocity) updateVelocity(exercise.id, value);
  };

  const handleCompleteSet = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress && onSetClick) {
      onSetClick(exercise.id, exercise.sets, event);
    }
  };

  const handleVideoClick = (exercise: any) => {
    if (onVideoClick) {
      onVideoClick(exercise);
    }
  };

  return (
    <div className="space-y-2">
      {/* Exercise Details Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 text-xs">
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">Sets</div>
          <div 
            className={`px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center ${
              workoutInProgress 
                ? 'bg-[#00ffba] hover:bg-[#00ffba]/80 text-black cursor-pointer transition-colors' 
                : 'bg-gray-100'
            }`}
            onClick={handleSetsClick}
          >
            {exercise.sets || '-'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">Reps</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center">
            {exercise.reps || '-'}
          </div>
          {workoutInProgress && (
            <Input
              type="text"
              placeholder={exercise.reps?.toString() || ''}
              value={savedData.reps || ''}
              onChange={(e) => handleRepsChange(e.target.value)}
              className="h-6 text-[10px] rounded-none mt-1 w-full text-center"
            />
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">%1RM</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center">
            {exercise.percentage_1rm || '-'}%
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">Kg</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center">
            {exercise.kg || '-'}
          </div>
          {workoutInProgress && (
            <Input
              type="text"
              placeholder={exercise.kg?.toString() || ''}
              value={savedData.kg || ''}
              onChange={(e) => handleKgChange(e.target.value)}
              className="h-6 text-[10px] rounded-none mt-1 w-full text-center"
            />
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">m/s</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center">
            {exercise.velocity_ms || '-'}
          </div>
          {workoutInProgress && (
            <Input
              type="text"
              placeholder={exercise.velocity_ms?.toString() || ''}
              value={savedData.velocity || ''}
              onChange={(e) => handleVelocityChange(e.target.value)}
              className="h-6 text-[10px] rounded-none mt-1 w-full text-center"
            />
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">Tempo</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center">
            {exercise.tempo || '-'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center text-[10px]">Rest</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full h-6 flex items-center justify-center">
            {exercise.rest || '-'}
          </div>
        </div>
      </div>
      
      {/* Complete Set Button */}
      {workoutInProgress && (
        <div className="mt-2">
          <Button
            onClick={handleCompleteSet}
            variant="outline"
            size="sm"
            className="w-full h-6 text-[10px] rounded-none"
          >
            Complete Set {getRemainingText ? getRemainingText(exercise.id) : ''}
          </Button>
        </div>
      )}
    </div>
  );
};

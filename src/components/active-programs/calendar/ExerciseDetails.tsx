
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
    <div className="space-y-1">
      {/* Exercise Details Grid - Two rows */}
      <div className="space-y-1">
        {/* First Row - Main values */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[9px] leading-tight">Sets</div>
            <div 
              className={`px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center ${
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
            <div className="text-gray-600 text-[9px] leading-tight">Reps</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.reps || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[9px] leading-tight">%1RM</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.percentage_1rm || '-'}%
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[9px] leading-tight">Kg</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.kg || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[9px] leading-tight">m/s</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.velocity_ms || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[9px] leading-tight">Tempo</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.tempo || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[9px] leading-tight">Rest</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.rest || '-'}
            </div>
          </div>
        </div>

        {/* Second Row - Actual values (only when workout in progress) */}
        {workoutInProgress && (
          <div className="grid grid-cols-7 gap-1 text-xs">
            <div></div> {/* Empty space for Sets column */}
            <div className="flex flex-col items-center">
              <Input
                type="text"
                placeholder={exercise.reps?.toString() || ''}
                value={savedData.reps || ''}
                onChange={(e) => handleRepsChange(e.target.value)}
                className="h-4 text-[9px] rounded-none w-full text-center p-0.5"
              />
            </div>
            <div></div> {/* Empty space for %1RM column */}
            <div className="flex flex-col items-center">
              <Input
                type="text"
                placeholder={exercise.kg?.toString() || ''}
                value={savedData.kg || ''}
                onChange={(e) => handleKgChange(e.target.value)}
                className="h-4 text-[9px] rounded-none w-full text-center p-0.5"
              />
            </div>
            <div className="flex flex-col items-center">
              <Input
                type="text"
                placeholder={exercise.velocity_ms?.toString() || ''}
                value={savedData.velocity || ''}
                onChange={(e) => handleVelocityChange(e.target.value)}
                className="h-4 text-[9px] rounded-none w-full text-center p-0.5"
              />
            </div>
            <div></div> {/* Empty space for Tempo column */}
            <div></div> {/* Empty space for Rest column */}
          </div>
        )}
      </div>
    </div>
  );
};


import React from 'react';
import { Input } from "@/components/ui/input";
import { VideoThumbnail } from '@/components/user-profile/daily-program/VideoThumbnail';
import { formatVelocityMs } from '@/utils/timeCalculations';

const REPS_MODE_LABELS: Record<string, string> = {
  'reps': 'Reps',
  'time': 'Time',
  'meter': 'Meter'
};

const KG_MODE_LABELS: Record<string, string> = {
  'kg': 'Kg',
  'rpm': 'RPM',
  'meter': 'Meter',
  's/m': 's/m',
  'km/h': 'km/h'
};

interface ExerciseDetailsProps {
  exercise: any;
  onVideoClick?: (exercise: any) => void;
  onSetClick?: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  workoutInProgress?: boolean;
  getRemainingText?: (exerciseId: string) => string;
  getCompletedSets?: (exerciseId: string) => number;
  updateReps?: (exerciseId: string, reps: string) => void;
  updateKg?: (exerciseId: string, kg: string) => void;
  updateVelocity?: (exerciseId: string, velocity: string) => void;
  getKg: (exerciseId: string) => string;
  getReps: (exerciseId: string) => string;
  getVelocity: (exerciseId: string) => string;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ 
  exercise, 
  onVideoClick,
  onSetClick,
  workoutInProgress = false,
  getRemainingText,
  getCompletedSets,
  updateReps,
  updateKg,
  updateVelocity,
  getKg,
  getReps,
  getVelocity
}) => {
  const handleSetsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress && onSetClick) {
      onSetClick(exercise.id, exercise.sets, event);
    }
  };

  // Get values from state via getters
  const currentKg = getKg(exercise.id);
  const currentReps = getReps(exercise.id);
  const currentVelocity = getVelocity(exercise.id);

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

  // Calculate remaining sets
  const completedSets = getCompletedSets ? getCompletedSets(exercise.id) : 0;
  const remainingSets = Math.max(0, (exercise.sets || 0) - completedSets);
  const displaySets = workoutInProgress ? remainingSets : (exercise.sets || '-');

  return (
    <div className="space-y-1">
      {/* Exercise Details Grid - Two rows */}
      <div className="space-y-1">
        {/* First Row - Main values */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">Sets</div>
            <div 
              className={`px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center ${
                workoutInProgress 
                  ? 'bg-[#00ffba] hover:bg-[#00ffba]/80 text-black cursor-pointer transition-colors' 
                  : 'bg-gray-100'
              }`}
              onClick={handleSetsClick}
            >
              {displaySets}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">{REPS_MODE_LABELS[exercise.reps_mode || 'reps']}</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.reps || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">%1RM</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.percentage_1rm ?? '-'}%
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">{KG_MODE_LABELS[exercise.kg_mode || 'kg']}</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.kg || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">m/s</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center">
              {formatVelocityMs(exercise.velocity_ms)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">Tempo</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center">
              {exercise.tempo || '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-600 text-[8px] md:text-[9px] leading-tight">Rest</div>
            <div className="bg-gray-100 px-0.5 py-1 rounded-none text-[9px] md:text-[10px] text-center w-full h-4 flex items-center justify-center">
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
                value={currentReps}
                onChange={(e) => handleRepsChange(e.target.value)}
                className="h-4 text-[8px] md:text-[9px] rounded-none w-full text-center p-0.5"
              />
            </div>
            <div></div> {/* Empty space for %1RM column */}
            <div className="flex flex-col items-center">
              <Input
                type="text"
                placeholder={exercise.kg?.toString() || ''}
                value={currentKg}
                onChange={(e) => handleKgChange(e.target.value)}
                className="h-4 text-[8px] md:text-[9px] rounded-none w-full text-center p-0.5"
              />
            </div>
            <div className="flex flex-col items-center">
              <Input
                type="text"
                placeholder={exercise.velocity_ms?.toString() ?? ''}
                value={currentVelocity}
                onChange={(e) => handleVelocityChange(e.target.value)}
                className="h-4 text-[8px] md:text-[9px] rounded-none w-full text-center p-0.5"
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

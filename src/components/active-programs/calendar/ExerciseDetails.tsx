
import React from 'react';
import { VideoThumbnail } from '@/components/user-profile/daily-program/VideoThumbnail';

interface ExerciseDetailsProps {
  exercise: any;
  onVideoClick?: (exercise: any) => void;
  onSetClick?: (event: React.MouseEvent) => void;
  workoutInProgress?: boolean;
  getRemainingText?: (exerciseId: string, totalSets: number) => string;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ 
  exercise, 
  onVideoClick,
  onSetClick,
  workoutInProgress = false,
  getRemainingText
}) => {
  const handleSetsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress && onSetClick) {
      onSetClick(event);
    }
  };

  const handleVideoClick = (exercise: any) => {
    if (onVideoClick) {
      onVideoClick(exercise);
    }
  };

  return (
    <div className="space-y-2">
      {/* Exercise Details Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-xs">
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center">Sets</div>
          <div 
            className={`px-1 py-0.5 rounded-none text-xs text-center w-full ${
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
          <div className="text-gray-600 mb-1 text-center">Reps</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full">
            {exercise.reps || '-'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center">%1RM</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full">
            {exercise.percentage_1rm || '-'}%
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center">Kg</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full">
            {exercise.kg || '-'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center">m/s</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full">
            {exercise.velocity_ms || '-'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center">Tempo</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full">
            {exercise.tempo || '-'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-gray-600 mb-1 text-center">Rest</div>
          <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs text-center w-full">
            {exercise.rest || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

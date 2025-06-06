
import React from 'react';
import { VideoThumbnail } from '@/components/user-profile/daily-program/VideoThumbnail';
import { Button } from "@/components/ui/button";

interface ExerciseDetailsProps {
  exercise: any;
  onVideoClick?: (exercise: any) => void;
  onSetClick?: (event: React.MouseEvent) => void;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ 
  exercise, 
  onVideoClick,
  onSetClick 
}) => {
  const handleVideoClick = (exerciseData: any) => {
    if (onVideoClick) {
      onVideoClick(exerciseData);
    }
  };

  return (
    <div className="grid grid-cols-10 gap-0.5 text-xs">
      <div className="text-center">
        <div className="text-gray-600 mb-1">Video</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex justify-center">
          {onVideoClick ? (
            <VideoThumbnail exercise={exercise} onVideoClick={handleVideoClick} />
          ) : (
            <span>-</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Sets</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.sets || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Complete</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex justify-center">
          {onSetClick && (
            <Button
              onClick={onSetClick}
              size="sm"
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-5 w-full text-xs px-1"
            >
              ✓
            </Button>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Reps</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.reps || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">%1RM</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.percentage_1rm || '-'}%</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Kg</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.kg || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">m/s</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.velocity_ms || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Tempo</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.tempo || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Rest</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">{exercise.rest || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Notes</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs">-</div>
      </div>
    </div>
  );
};


import React from 'react';

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

  const remainingText = getRemainingText ? getRemainingText(exercise.id, exercise.sets) : '';

  return (
    <div className="flex justify-center">
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
        {remainingText && (
          <div className="text-xs text-gray-500 mt-1 text-center">
            {remainingText}
          </div>
        )}
      </div>
    </div>
  );
};

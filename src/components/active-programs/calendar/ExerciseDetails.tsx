
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
    <div className="grid grid-cols-8 gap-0.5 text-xs">
      <div className="text-center">
        <div className="text-gray-600 mb-1">Sets</div>
        <div 
          className={`px-1 py-0.5 rounded-none text-xs ${
            workoutInProgress 
              ? 'bg-[#00ffba] hover:bg-[#00ffba]/80 text-black cursor-pointer transition-colors' 
              : 'bg-gray-100'
          }`}
          onClick={handleSetsClick}
        >
          {exercise.sets || '-'}{remainingText}
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

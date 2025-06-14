
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

  return (
    <div className="grid grid-cols-6 gap-0.5 text-xs">
      <div className="text-center">
        <div className="text-gray-600 mb-1">Sets</div>
        <div 
          className={`px-1 py-0.5 rounded-none text-xs flex flex-col items-center ${
            workoutInProgress 
              ? 'bg-[#00ffba] hover:bg-[#00ffba]/80 text-black cursor-pointer transition-colors' 
              : 'bg-gray-100'
          }`}
          onClick={handleSetsClick}
        >
          <span>{exercise.sets || '-'}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Reps</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex flex-col items-center">
          <span>{exercise.reps || '-'}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">%1RM</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex flex-col items-center">
          <span>{exercise.percentage_1rm || '-'}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Kg</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex flex-col items-center">
          <span>{exercise.kg || '-'}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">m/s</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex flex-col items-center">
          <span>{exercise.velocity_ms || '-'}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Tempo</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none text-xs flex flex-col items-center">
          <span>{exercise.tempo || '-'}</span>
        </div>
      </div>
    </div>
  );
};

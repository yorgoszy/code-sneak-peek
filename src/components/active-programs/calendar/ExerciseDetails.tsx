
import React from 'react';

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
  return (
    <div className="grid grid-cols-8 gap-0.5 text-xs">
      <div className="text-center">
        <div className="text-gray-600 mb-1">Sets</div>
        <div 
          className="bg-gray-100 px-1 py-0.5 rounded-none text-xs cursor-pointer hover:bg-[#00ffba] hover:text-black transition-colors"
          onClick={onSetClick}
        >
          {exercise.sets || '-'}
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

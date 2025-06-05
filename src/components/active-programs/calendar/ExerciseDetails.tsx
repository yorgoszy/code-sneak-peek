
import React from 'react';

interface ExerciseDetailsProps {
  exercise: any;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ exercise }) => {
  return (
    <div className="grid grid-cols-7 gap-1 text-xs">
      <div className="text-center">
        <div className="text-gray-600 mb-1">Sets</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.sets || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Reps</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.reps || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">%1RM</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.percentage_1rm || '-'}%</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Kg</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.kg || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">m/s</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.velocity_ms || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Tempo</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.tempo || '-'}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-600 mb-1">Rest</div>
        <div className="bg-gray-100 px-1 py-0.5 rounded-none">{exercise.rest || '-'}</div>
      </div>
    </div>
  );
};

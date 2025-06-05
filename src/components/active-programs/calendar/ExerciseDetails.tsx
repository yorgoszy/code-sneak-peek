
import React from 'react';

interface ExerciseDetailsProps {
  exercise: any;
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ exercise }) => {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {/* Planned Values */}
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Planned Sets</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.sets || '-'}</div>
        </div>
        
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Planned Reps</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.reps || '-'}</div>
        </div>
        
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">%1RM</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.percentage_1rm || '-'}%</div>
        </div>
        
        <div className="text-xs">
          <label className="block text-gray-600 mb-1">Planned Kg</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.kg || '-'}</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-xs">
        <div>
          <label className="block text-gray-600 mb-1">Tempo</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.tempo || '-'}</div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-1">Rest (s)</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.rest || '-'}</div>
        </div>
        
        <div>
          <label className="block text-gray-600 mb-1">Target m/s</label>
          <div className="bg-gray-100 px-2 py-1 rounded-none">{exercise.velocity_ms || '-'}</div>
        </div>
      </div>
    </div>
  );
};

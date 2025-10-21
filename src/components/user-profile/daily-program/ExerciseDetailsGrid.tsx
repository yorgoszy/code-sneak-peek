
import React from 'react';
import { Separator } from "@/components/ui/separator";

interface ExerciseDetailsGridProps {
  exercise: {
    id: string;
    sets: number;
    reps: string;
    kg?: string;
    percentage_1rm?: number;
    velocity_ms?: number;
    tempo?: string;
    rest?: string;
    notes?: string;
  };
  isComplete: boolean;
  remainingText: string;
  actualValues?: {
    reps?: string;
    kg?: string;
    velocity?: string;
  };
}

export const ExerciseDetailsGrid: React.FC<ExerciseDetailsGridProps> = ({
  exercise,
  isComplete,
  remainingText,
  actualValues
}) => {
  return (
    <div className="p-1 bg-gray-50">
      <div className="flex text-xs" style={{ width: '70%' }}>
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">Sets</div>
          <div className={`${isComplete ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
            {exercise.sets || '-'}{remainingText}
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-10 mx-1" />
        
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">Reps</div>
          <div className="text-gray-900">{exercise.reps || '-'}</div>
          {actualValues?.reps && (
            <div className="text-xs text-green-600 font-medium">{actualValues.reps}</div>
          )}
        </div>
        
        <Separator orientation="vertical" className="h-10 mx-1" />
        
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">%1RM</div>
          <div className="text-gray-900">{exercise.percentage_1rm ?? '-'}</div>
        </div>
        
        <Separator orientation="vertical" className="h-10 mx-1" />
        
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">Kg</div>
          <div className="text-gray-900">{exercise.kg || '-'}</div>
          {actualValues?.kg && (
            <div className="text-xs text-green-600 font-medium">{actualValues.kg}</div>
          )}
        </div>
        
        <Separator orientation="vertical" className="h-10 mx-1" />
        
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">m/s</div>
          <div className="text-gray-900">{exercise.velocity_ms ?? '-'}</div>
          {actualValues?.velocity && (
            <div className="text-xs text-green-600 font-medium">{actualValues.velocity}</div>
          )}
        </div>
        
        <Separator orientation="vertical" className="h-10 mx-1" />
        
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">Tempo</div>
          <div className="text-gray-900">{exercise.tempo || '-'}</div>
        </div>
        
        <Separator orientation="vertical" className="h-10 mx-1" />
        
        <div className="flex-1 text-center">
          <div className="font-medium text-gray-600 mb-1">Rest</div>
          <div className="text-gray-900">{exercise.rest || '-'}</div>
        </div>
      </div>
      
      {exercise.notes && (
        <div className="mt-1 text-xs text-gray-600 italic">
          {exercise.notes}
        </div>
      )}
    </div>
  );
};

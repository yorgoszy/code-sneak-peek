
import React from 'react';
import { Clock, Dumbbell } from 'lucide-react';
import { Exercise, Block } from '../types';

interface DayCalculationsProps {
  blocks: Block[];
  exercises: Exercise[];
}

export const DayCalculations: React.FC<DayCalculationsProps> = ({ blocks, exercises }) => {
  const calculateTotals = () => {
    let totalSets = 0;
    let totalExercises = 0;
    let estimatedDuration = 0;

    blocks.forEach(block => {
      block.program_exercises.forEach(exercise => {
        totalSets += exercise.sets;
        totalExercises += 1;
        
        // Εκτίμηση διάρκειας: 1 λεπτό ανά σετ + χρόνος ανάπαυσης
        const restTime = parseFloat(exercise.rest || '60') || 60; // default 60 seconds
        estimatedDuration += (exercise.sets * 60) + (exercise.sets * restTime);
      });
    });

    return {
      totalSets,
      totalExercises,
      estimatedDuration: Math.round(estimatedDuration / 60) // σε λεπτά
    };
  };

  const { totalSets, totalExercises, estimatedDuration } = calculateTotals();

  if (totalExercises === 0) return null;

  return (
    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            <span>{totalExercises} ασκήσεις</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{totalSets} σετ</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>~{estimatedDuration} λεπτά</span>
        </div>
      </div>
    </div>
  );
};

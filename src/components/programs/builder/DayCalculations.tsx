
import React from 'react';
import { calculateVolume, calculatePower, calculateTime, parseReps } from './utils/calculations';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface DayCalculationsProps {
  blocks: Block[];
}

export const DayCalculations: React.FC<DayCalculationsProps> = ({ blocks }) => {
  // Get all exercises from all blocks
  const allExercises = blocks.flatMap(block => block.exercises);
  
  // Calculate totals
  const totalVolume = allExercises.reduce((sum, exercise) => {
    return sum + calculateVolume(exercise.sets, exercise.reps, exercise.kg);
  }, 0);
  
  const totalWatts = allExercises.reduce((sum, exercise) => {
    return sum + calculatePower(exercise.kg, exercise.velocity_ms);
  }, 0);
  
  const totalTime = allExercises.reduce((sum, exercise) => {
    return sum + calculateTime(exercise.sets, exercise.reps, exercise.tempo, exercise.rest);
  }, 0);
  
  // Calculate average intensity (average %1RM of all exercises)
  const validPercentages = allExercises.filter(ex => ex.percentage_1rm > 0);
  const averageIntensity = validPercentages.length > 0 
    ? validPercentages.reduce((sum, ex) => sum + ex.percentage_1rm, 0) / validPercentages.length 
    : 0;
  
  // Format time to minutes:seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (allExercises.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 p-3 bg-gray-50 border" style={{ borderRadius: '0px' }}>
      <h4 className="font-medium mb-2" style={{ fontSize: '11px' }}>Υπολογισμοί Ημέρας</h4>
      <div className="grid grid-cols-4 gap-4" style={{ fontSize: '9px' }}>
        <div>
          <label className="block font-medium text-gray-600">Όγκος (kg)</label>
          <span className="font-bold">{totalVolume.toFixed(0)}</span>
        </div>
        <div>
          <label className="block font-medium text-gray-600">Μ.Ο. Ένταση (%)</label>
          <span className="font-bold">{averageIntensity.toFixed(1)}</span>
        </div>
        <div>
          <label className="block font-medium text-gray-600">Συνολικά Watts</label>
          <span className="font-bold">{totalWatts.toFixed(0)}</span>
        </div>
        <div>
          <label className="block font-medium text-gray-600">Χρόνος</label>
          <span className="font-bold">{formatTime(totalTime)}</span>
        </div>
      </div>
    </div>
  );
};

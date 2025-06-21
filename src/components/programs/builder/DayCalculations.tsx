import React from 'react';
import { Clock, Dumbbell, TrendingUp, Zap } from 'lucide-react';
import { Exercise, Block } from '../types';

interface DayCalculationsProps {
  blocks: Block[];
  exercises: Exercise[];
}

const parseTempoToSeconds = (tempo: string): number => {
  if (!tempo || tempo.trim() === '') {
    return 3; // Default tempo 1.1.1 = 1+1+1 = 3 seconds
  }
  
  // Split by '.' and sum all numbers
  const parts = tempo.split('.');
  let totalSeconds = 0;
  
  parts.forEach(part => {
    if (part === 'x' || part === 'X') {
      totalSeconds += 0.5;
    } else {
      totalSeconds += parseFloat(part) || 0;
    }
  });
  
  return totalSeconds;
};

const parseRepsToTotal = (reps: string): number => {
  if (!reps) return 0;
  
  // If no dots, it's a simple number
  if (!reps.includes('.')) {
    return parseInt(reps) || 0;
  }
  
  // Split by '.' and sum all numbers
  const parts = reps.split('.');
  let totalReps = 0;
  
  parts.forEach(part => {
    totalReps += parseInt(part) || 0;
  });
  
  return totalReps;
};

const parseRestTime = (rest: string): number => {
  if (!rest) return 0;
  
  // Handle formats like "2'", "1:30", "90s", "2"
  if (rest.includes(':')) {
    const [minutes, seconds] = rest.split(':');
    return (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  } else if (rest.includes("'")) {
    return (parseFloat(rest.replace("'", "")) || 0) * 60; // Convert minutes to seconds
  } else if (rest.includes('s')) {
    return parseFloat(rest.replace('s', '')) || 0;
  } else {
    const minutes = parseFloat(rest) || 0;
    return minutes * 60; // Convert minutes to seconds
  }
};

// Helper function to parse strings with comma as decimal separator
const parseNumberWithComma = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  // Replace comma with dot for proper parsing
  const normalizedValue = value.toString().replace(',', '.');
  return parseFloat(normalizedValue) || 0;
};

export const DayCalculations: React.FC<DayCalculationsProps> = ({ blocks, exercises }) => {
  const calculateDayMetrics = () => {
    let totalVolume = 0; // in kg
    let totalIntensitySum = 0;
    let intensityCount = 0;
    let totalWatts = 0;
    let totalTimeSeconds = 0;

    blocks.forEach(block => {
      block.program_exercises.forEach(exercise => {
        if (exercise.exercise_id) {
          const sets = exercise.sets || 0;
          const reps = parseRepsToTotal(exercise.reps);
          const kg = parseNumberWithComma(exercise.kg || '0');

          // Volume calculation (sets × reps × kg) in kg
          const volumeKg = sets * reps * kg;
          totalVolume += volumeKg;

          // Intensity calculation - μέσος όρος όλων των εντάσεων
          const intensity = parseNumberWithComma(exercise.percentage_1rm || '0');
          if (intensity > 0) {
            totalIntensitySum += intensity;
            intensityCount++;
          }

          // Watts calculation - Force × Velocity
          const velocity = parseNumberWithComma(exercise.velocity_ms || '0');
          if (kg > 0 && velocity > 0) {
            // Force = mass × acceleration (9.81 m/s²)
            const force = kg * 9.81; // in Newtons
            // Power = Force × Velocity
            const watts = force * velocity;
            // Συνολική ισχύς για όλα τα sets και reps
            totalWatts += watts * sets * reps;
          }

          // Time calculation: (sets × reps × tempo) + (sets - 1) × rest
          const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
          const restSeconds = parseRestTime(exercise.rest || '');
          
          // Work time: sets × reps × tempo (in seconds)
          const workTime = sets * reps * tempoSeconds;
          
          // Rest time: (sets - 1) × rest time between sets
          const totalRestTime = (sets - 1) * restSeconds;
          
          totalTimeSeconds += workTime + totalRestTime;
        }
      });
    });

    return {
      volume: Math.round(totalVolume / 1000), // Convert kg to tons
      intensity: intensityCount > 0 ? Math.round(totalIntensitySum / intensityCount) : 0, // Μέσος όρος
      watts: Math.round(totalWatts / 1000), // Convert watts to kilowatts
      time: Math.round(totalTimeSeconds / 60), // Convert to minutes
      exerciseCount: blocks.reduce((total, block) => 
        total + (block.program_exercises?.filter(ex => ex.exercise_id).length || 0), 0)
    };
  };

  const { volume, intensity, watts, time } = calculateDayMetrics();

  // Πάντα εμφανίζουμε τη γραμμή στατιστικών
  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
      <div className="grid grid-cols-4 gap-4 text-xs">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600">Όγκος</span>
          </div>
          <div className="font-semibold text-blue-700">{volume.toLocaleString()}tn</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Dumbbell className="w-3 h-3 text-green-600" />
            <span className="text-gray-600">Ένταση</span>
          </div>
          <div className="font-semibold text-green-700">{intensity}%</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-orange-600" />
            <span className="text-gray-600">Ισχύς</span>
          </div>
          <div className="font-semibold text-orange-700">{watts}KW</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-red-600" />
            <span className="text-gray-600">Χρόνος</span>
          </div>
          <div className="font-semibold text-red-700">{time}λ</div>
        </div>
      </div>
    </div>
  );
};

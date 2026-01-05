
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Week } from '../types';

interface WeekMetricsProps {
  week: Week;
  previousWeek?: Week;
}

interface WeekStats {
  volume: string;
  intensity: string;
  watts: string;
  time: number;
}

const parseTempoToSeconds = (tempo: string): number => {
  if (!tempo || tempo.trim() === '') {
    return 3; // Default tempo
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

const calculateWeekMetrics = (week: Week): WeekStats => {
  let totalVolume = 0; // in kg
  let totalIntensity = 0;
  let totalWatts = 0;
  let totalTimeSeconds = 0;
  let exerciseCount = 0;

  week.program_days.forEach(day => {
    day.program_blocks.forEach(block => {
      const blockMultiplier = block.block_sets || 1;
      
      block.program_exercises.forEach(exercise => {
        if (exercise.exercise_id) {
          const sets = exercise.sets || 0;
          const reps = parseRepsToTotal(exercise.reps);
          const kg = parseFloat(exercise.kg || '0') || 0;

          // Volume calculation (sets × reps × kg) in kg
          // Only calculate if kg_mode is 'kg' or undefined
          if ((!exercise.kg_mode || exercise.kg_mode === 'kg') && kg > 0) {
            const volumeKg = sets * reps * kg * blockMultiplier;
            totalVolume += volumeKg;
          }

          // Intensity calculation (average percentage of 1RM)
          if (exercise.percentage_1rm) {
            totalIntensity += exercise.percentage_1rm;
            exerciseCount++;
          }

          // Watts calculation
          const velocity = exercise.velocity_ms || 0;
          if (kg > 0 && velocity > 0) {
            const force = kg * 9.81; // Convert to Newtons
            const watts = force * velocity;
            totalWatts += watts * sets * reps * blockMultiplier;
          }

          // Time calculation: (sets × reps × tempo) + (sets - 1) × rest
          const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
          const restSeconds = parseRestTime(exercise.rest || '');
          
          // Work time: sets × reps × tempo (in seconds)
          const workTime = sets * reps * tempoSeconds;
          
          // Rest time: sets × rest time between sets
          const totalRestTime = sets * restSeconds;
          
          totalTimeSeconds += (workTime + totalRestTime) * blockMultiplier;
        }
      });
    });
  });

  return {
    volume: (totalVolume / 1000).toFixed(2), // Convert kg to tons with 2 decimal places
    intensity: exerciseCount > 0 ? String(Math.min(100, Math.round(totalIntensity / exerciseCount))) : '0', // Ακέραιος μέχρι 100%
    watts: (totalWatts / 1000).toFixed(1), // Convert watts to kilowatts with 1 decimal place
    time: Math.round(totalTimeSeconds / 60) // Convert to minutes
  };
};

const calculatePercentageChange = (current: string, previous: string): number => {
  const currentNum = parseFloat(current);
  const previousNum = parseFloat(previous);
  if (previousNum === 0) return 0;
  return Math.round(((currentNum - previousNum) / previousNum) * 100);
};

const PercentageIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  if (percentage === 0) {
    return (
      <span className="flex items-center text-gray-500">
        <Minus className="w-3 h-3 mr-1" />
        0%
      </span>
    );
  }

  const isPositive = percentage > 0;
  return (
    <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? (
        <TrendingUp className="w-3 h-3 mr-1" />
      ) : (
        <TrendingDown className="w-3 h-3 mr-1" />
      )}
      {Math.abs(percentage)}%
    </span>
  );
};

export const WeekMetrics: React.FC<WeekMetricsProps> = ({ week, previousWeek }) => {
  const currentStats = calculateWeekMetrics(week);
  const previousStats = previousWeek ? calculateWeekMetrics(previousWeek) : null;

  return (
    <div className="flex items-center gap-2 text-[9px] px-1">
      <span className="font-medium text-blue-700">{currentStats.volume}tn</span>
      <span className="font-medium text-green-700">{currentStats.intensity}%</span>
      <span className="font-medium text-orange-700">{currentStats.watts}KW</span>
      <span className="font-medium text-red-700">{currentStats.time}λ</span>
    </div>
  );
};

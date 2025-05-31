
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface WeekMetricsProps {
  week: Week;
  previousWeek?: Week;
}

interface WeekStats {
  volume: number;
  intensity: number;
  watts: number;
  time: number;
}

const calculateWeekMetrics = (week: Week): WeekStats => {
  let totalVolume = 0;
  let totalIntensity = 0;
  let totalWatts = 0;
  let totalTime = 0;
  let exerciseCount = 0;

  week.days.forEach(day => {
    day.blocks.forEach(block => {
      block.exercises.forEach(exercise => {
        if (exercise.exercise_id) {
          // Volume calculation (sets × reps × kg)
          const sets = exercise.sets || 0;
          const reps = parseFloat(exercise.reps) || 0;
          const kg = parseFloat(exercise.kg) || 0;
          totalVolume += sets * reps * kg;

          // Intensity calculation (average percentage of 1RM)
          if (exercise.percentage_1rm) {
            totalIntensity += exercise.percentage_1rm;
            exerciseCount++;
          }

          // Watts calculation
          const watts = parseFloat(exercise.velocity_ms) || 0;
          totalWatts += watts * sets;

          // Time calculation (estimated from rest periods)
          const restSeconds = parseRestTime(exercise.rest);
          totalTime += (sets - 1) * restSeconds; // Rest between sets
        }
      });
    });
  });

  return {
    volume: Math.round(totalVolume),
    intensity: exerciseCount > 0 ? Math.round(totalIntensity / exerciseCount) : 0,
    watts: Math.round(totalWatts),
    time: Math.round(totalTime / 60) // Convert to minutes
  };
};

const parseRestTime = (rest: string): number => {
  if (!rest) return 0;
  const match = rest.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
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
    <div className="text-xs space-y-1 mt-1 px-2 py-1 bg-gray-50 rounded">
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="font-semibold text-blue-700">{currentStats.volume.toLocaleString()}tn</div>
          {previousStats && (
            <PercentageIndicator 
              percentage={calculatePercentageChange(currentStats.volume, previousStats.volume)} 
            />
          )}
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-green-700">{currentStats.intensity}%</div>
          {previousStats && (
            <PercentageIndicator 
              percentage={calculatePercentageChange(currentStats.intensity, previousStats.intensity)} 
            />
          )}
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-orange-700">{currentStats.watts}w</div>
          {previousStats && (
            <PercentageIndicator 
              percentage={calculatePercentageChange(currentStats.watts, previousStats.watts)} 
            />
          )}
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-red-700">{currentStats.time}λ</div>
          {previousStats && (
            <PercentageIndicator 
              percentage={calculatePercentageChange(currentStats.time, previousStats.time)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Clock, Dumbbell, TrendingUp, Zap } from 'lucide-react';
import { Exercise, Block } from '../types';
import { parseRepsToTime, parseTempoToSeconds, parseRestTime, parseNumberWithComma } from '@/utils/timeCalculations';

interface DayCalculationsProps {
  blocks: Block[];
  exercises: Exercise[];
}

export const DayCalculations: React.FC<DayCalculationsProps> = ({ blocks, exercises }) => {
  // Helper function to parse workout_duration (format: "MM:SS" or "M:SS")
  const parseWorkoutDuration = (duration: string): number => {
    if (!duration) return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  };

  const calculateDayMetrics = () => {
    let totalVolume = 0; // in kg
    let totalIntensitySum = 0;
    let intensityCount = 0;
    let totalWatts = 0;
    let totalTimeSeconds = 0;

    blocks.forEach(block => {
      const blockMultiplier = block.block_sets || 1;
      
      // Αν το block έχει workout_format και workout_duration, χρησιμοποιούμε τη διάρκεια του format
      if (block.workout_format && block.workout_duration) {
        const blockDurationSeconds = parseWorkoutDuration(block.workout_duration);
        totalTimeSeconds += blockDurationSeconds * blockMultiplier;
        
        // Υπολογίζουμε μόνο volume, intensity, watts για τις ασκήσεις
        block.program_exercises.forEach(exercise => {
          if (exercise.exercise_id) {
            const sets = exercise.sets || 0;
            const repsData = parseRepsToTime(exercise.reps);
            const kg = parseNumberWithComma(exercise.kg || '0');
            const isTimeMode = exercise.reps_mode === 'time' || repsData.isTime;

            // Volume calculation
            if (!isTimeMode && (!exercise.kg_mode || exercise.kg_mode === 'kg') && kg > 0) {
              const volumeKg = sets * repsData.count * kg * blockMultiplier;
              totalVolume += volumeKg;
            }

            // Intensity calculation
            const intensity = parseNumberWithComma(exercise.percentage_1rm || '0');
            if (intensity > 0) {
              totalIntensitySum += intensity;
              intensityCount++;
            }

            // Watts calculation
            const velocity = parseNumberWithComma(exercise.velocity_ms || '0');
            if (kg > 0 && velocity > 0 && !isTimeMode) {
              const force = kg * 9.81;
              const watts = force * velocity;
              totalWatts += watts * sets * repsData.count * blockMultiplier;
            }
          }
        });
      } else {
        // Κανονικός υπολογισμός χρόνου από tempo/reps/rest
        block.program_exercises.forEach(exercise => {
          if (exercise.exercise_id) {
            const sets = exercise.sets || 0;
            const repsData = parseRepsToTime(exercise.reps);
            const kg = parseNumberWithComma(exercise.kg || '0');

            const isTimeMode = exercise.reps_mode === 'time' || repsData.isTime;

            if (isTimeMode) {
              const workTime = sets * repsData.seconds;
              const restSeconds = parseRestTime(exercise.rest || '');
              const totalRestTime = sets * restSeconds;
              totalTimeSeconds += (workTime + totalRestTime) * blockMultiplier;
            } else {
              const reps = repsData.count;
              
              if ((!exercise.kg_mode || exercise.kg_mode === 'kg') && kg > 0) {
                const volumeKg = sets * reps * kg * blockMultiplier;
                totalVolume += volumeKg;
              }

              const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
              const restSeconds = parseRestTime(exercise.rest || '');
              const workTime = sets * reps * tempoSeconds;
              const totalRestTime = sets * restSeconds;
              totalTimeSeconds += (workTime + totalRestTime) * blockMultiplier;
            }

            const intensity = parseNumberWithComma(exercise.percentage_1rm || '0');
            if (intensity > 0) {
              totalIntensitySum += intensity;
              intensityCount++;
            }

            const velocity = parseNumberWithComma(exercise.velocity_ms || '0');
            if (kg > 0 && velocity > 0 && !isTimeMode) {
              const force = kg * 9.81;
              const watts = force * velocity;
              totalWatts += watts * sets * repsData.count * blockMultiplier;
            }
          }
        });
      }
    });

    return {
      volume: (totalVolume / 1000).toFixed(2),
      intensity: intensityCount > 0 ? Math.round(totalIntensitySum / intensityCount).toFixed(0) : '0',
      watts: (totalWatts / 1000).toFixed(1),
      time: Math.round(totalTimeSeconds / 60),
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
          <div className="font-semibold text-blue-700">{volume}tn</div>
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

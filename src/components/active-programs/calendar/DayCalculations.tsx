
import React from 'react';
import { Clock, Dumbbell, TrendingUp, Zap } from 'lucide-react';
import { parseRepsToTime, parseTempoToSeconds, parseRestTime, parseNumberWithComma } from '@/utils/timeCalculations';

interface DayCalculationsProps {
  blocks: any[];
}

export const DayCalculations: React.FC<DayCalculationsProps> = ({ blocks }) => {
  const calculateDayMetrics = () => {
    let totalVolume = 0; // in kg
    let totalIntensitySum = 0;
    let intensityCount = 0;
    let totalWatts = 0;
    let totalTimeSeconds = 0;

    blocks?.forEach(block => {
      block.program_exercises?.forEach((exercise: any) => {
        if (exercise.exercise_id) {
          const sets = exercise.sets || 0;
          const repsData = parseRepsToTime(exercise.reps);
          const kg = parseNumberWithComma(exercise.kg || '0');

          if (repsData.isTime) {
            // Αν το reps είναι χρόνος, προσθέτουμε τον χρόνο απευθείας
            // Time calculation for time-based reps: sets × time_per_set + (sets - 1) × rest
            const workTime = sets * repsData.seconds;
            const restSeconds = parseRestTime(exercise.rest || '');
            const totalRestTime = (sets - 1) * restSeconds;
            totalTimeSeconds += workTime + totalRestTime;
            
            // Δεν υπολογίζουμε όγκο για χρονικές ασκήσεις
          } else {
            // Κανονική άσκηση με επαναλήψεις
            const reps = repsData.count;
            
            // Volume calculation (sets × reps × kg) in kg
            const volumeKg = sets * reps * kg;
            totalVolume += volumeKg;

            // Time calculation: (sets × reps × tempo) + (sets - 1) × rest
            const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
            const restSeconds = parseRestTime(exercise.rest || '');
            
            // Work time: sets × reps × tempo (in seconds)
            const workTime = sets * reps * tempoSeconds;
            
            // Rest time: (sets - 1) × rest time between sets
            const totalRestTime = (sets - 1) * restSeconds;
            
            totalTimeSeconds += workTime + totalRestTime;
          }

          // Intensity calculation - μέσος όρος όλων των εντάσεων
          const intensity = parseNumberWithComma(exercise.percentage_1rm || '0');
          if (intensity > 0) {
            totalIntensitySum += intensity;
            intensityCount++;
          }

          // Watts calculation - Force × Velocity (μόνο για ασκήσεις με βάρος)
          const velocity = parseNumberWithComma(exercise.velocity_ms || '0');
          if (kg > 0 && velocity > 0 && !repsData.isTime) {
            // Force = mass × acceleration (9.81 m/s²)
            const force = kg * 9.81; // in Newtons
            // Power = Force × Velocity
            const watts = force * velocity;
            // Συνολική ισχύς για όλα τα sets και reps
            totalWatts += watts * sets * repsData.count;
          }
        }
      });
    });

    return {
      volume: Math.round(totalVolume / 1000), // Convert kg to tons
      intensity: intensityCount > 0 ? Math.round(totalIntensitySum / intensityCount) : 0, // Μέσος όρος
      watts: Math.round(totalWatts / 1000), // Convert watts to kilowatts
      time: Math.round(totalTimeSeconds / 60), // Convert to minutes
      exerciseCount: blocks?.reduce((total, block) => 
        total + (block.program_exercises?.filter((ex: any) => ex.exercise_id).length || 0), 0) || 0
    };
  };

  const { volume, intensity, watts, time, exerciseCount } = calculateDayMetrics();

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


import { parseRepsToTime, parseTempoToSeconds, parseRestTime, parseNumberWithComma } from '@/utils/timeCalculations';

export const calculateDayMetrics = (blocks: any[]) => {
  let totalVolume = 0;
  let totalTimeMinutes = 0;

  blocks.forEach(block => {
    block.program_exercises?.forEach((exercise: any) => {
      if (!exercise.exercise_id) return;

      const sets = exercise.sets || 1;
      const repsData = parseRepsToTime(exercise.reps);
      const kg = parseFloat(exercise.kg) || 0;
      const tempo = parseTempoToSeconds(exercise.tempo);
      const rest = parseRestTime(exercise.rest) / 60; // Convert to minutes

      if (repsData.isTime) {
        // Time-based exercise
        const workTime = (sets * repsData.seconds) / 60; // Convert to minutes
        const restTime = (sets - 1) * rest;
        totalTimeMinutes += workTime + restTime;
        
        // No volume calculation for time-based exercises
      } else {
        // Rep-based exercise
        const reps = repsData.count;
        
        // Volume: sets × reps × kg
        const volume = sets * reps * kg;
        totalVolume += volume;

        // Time: [(sets × reps) × tempo] + (sets - 1) × rest
        const workTime = (sets * reps * tempo) / 60; // Convert to minutes
        const restTime = (sets - 1) * rest;
        totalTimeMinutes += workTime + restTime;
      }
    });
  });

  return {
    volume: totalVolume,
    timeMinutes: totalTimeMinutes
  };
};

// Re-export the utility functions for backward compatibility
export { parseRepsToTime as parseRepsToTotal } from '@/utils/timeCalculations';
export { parseTempoToSeconds } from '@/utils/timeCalculations';

export const parseRestToMinutes = (rest: string): number => {
  return parseRestTime(rest) / 60; // Convert seconds to minutes
};

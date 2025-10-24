import { useMemo } from 'react';

export interface BlockStats {
  training_type?: string;
  volume: number; // in kg
  intensity: number; // percentage
  watts: number; // in watts
  time: number; // in seconds
}

export interface ProgramStats {
  totalVolume: number; // in tons
  totalIntensity: number; // average percentage
  totalWatts: number; // in kilowatts
  totalTime: number; // in minutes
  blockStats: BlockStats[];
}

const parseTempoToSeconds = (tempo: string): number => {
  if (!tempo || tempo.trim() === '') return 3;
  
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
  
  if (!reps.includes('.')) {
    return parseInt(reps) || 0;
  }
  
  const parts = reps.split('.');
  let totalReps = 0;
  
  parts.forEach(part => {
    totalReps += parseInt(part) || 0;
  });
  
  return totalReps;
};

const parseRestTime = (rest: string): number => {
  if (!rest) return 0;
  
  if (rest.includes(':')) {
    const [minutes, seconds] = rest.split(':');
    return (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  } else if (rest.includes("'")) {
    return (parseFloat(rest.replace("'", "")) || 0) * 60;
  } else if (rest.includes('s')) {
    return parseFloat(rest.replace('s', '')) || 0;
  } else {
    const minutes = parseFloat(rest) || 0;
    return minutes * 60;
  }
};

// Regular function instead of hook - can be called anywhere
export const calculateProgramStats = (program: any): ProgramStats => {
    let totalVolume = 0;
    let totalIntensity = 0;
    let totalWatts = 0;
    let totalTimeSeconds = 0;
    let exerciseCount = 0;
    const blockStats: BlockStats[] = [];

    if (!program?.programs?.program_weeks) {
      return {
        totalVolume: 0,
        totalIntensity: 0,
        totalWatts: 0,
        totalTime: 0,
        blockStats: []
      };
    }

    program.programs.program_weeks.forEach((week: any) => {
      week.program_days?.forEach((day: any) => {
        day.program_blocks?.forEach((block: any) => {
          let blockVolume = 0;
          let blockIntensity = 0;
          let blockWatts = 0;
          let blockTime = 0;
          let blockExerciseCount = 0;

          block.program_exercises?.forEach((exercise: any) => {
            if (exercise.exercise_id) {
              const sets = exercise.sets || 0;
              const reps = parseRepsToTotal(exercise.reps);
              const kg = parseFloat(exercise.kg || '0') || 0;

              // Volume
              if ((!exercise.kg_mode || exercise.kg_mode === 'kg') && kg > 0) {
                const volumeKg = sets * reps * kg;
                blockVolume += volumeKg;
                totalVolume += volumeKg;
              }

              // Intensity
              if (exercise.percentage_1rm) {
                blockIntensity += exercise.percentage_1rm;
                totalIntensity += exercise.percentage_1rm;
                blockExerciseCount++;
                exerciseCount++;
              }

              // Watts
              const velocity = exercise.velocity_ms || 0;
              if (kg > 0 && velocity > 0) {
                const force = kg * 9.81;
                const watts = force * velocity;
                const exerciseWatts = watts * sets * reps;
                blockWatts += exerciseWatts;
                totalWatts += exerciseWatts;
              }

              // Time
              const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
              const restSeconds = parseRestTime(exercise.rest || '');
              const workTime = sets * reps * tempoSeconds;
              const totalRestTime = sets * restSeconds;
              const exerciseTime = workTime + totalRestTime;
              blockTime += exerciseTime;
              totalTimeSeconds += exerciseTime;
            }
          });

          blockStats.push({
            training_type: block.training_type,
            volume: blockVolume,
            intensity: blockExerciseCount > 0 ? blockIntensity / blockExerciseCount : 0,
            watts: blockWatts,
            time: blockTime
          });
        });
      });
    });

    return {
      totalVolume: totalVolume / 1000, // Convert to tons
      totalIntensity: exerciseCount > 0 ? totalIntensity / exerciseCount : 0,
      totalWatts: totalWatts / 1000, // Convert to kilowatts
    totalTime: Math.round(totalTimeSeconds / 60), // Convert to minutes
    blockStats
  };
};

// Hook wrapper for use in components
export const useProgramStats = (program: any): ProgramStats => {
  return useMemo(() => calculateProgramStats(program), [program]);
};

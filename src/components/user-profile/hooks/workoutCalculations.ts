
export const calculateDayMetrics = (blocks: any[]) => {
  let totalVolume = 0;
  let totalTimeMinutes = 0;

  blocks.forEach(block => {
    block.program_exercises?.forEach((exercise: any) => {
      if (!exercise.exercise_id) return;

      const sets = exercise.sets || 1;
      const reps = parseRepsToTotal(exercise.reps);
      const kg = parseFloat(exercise.kg) || 0;
      const tempo = parseTempoToSeconds(exercise.tempo);
      const rest = parseRestToMinutes(exercise.rest);

      // Volume: sets × reps × kg
      const volume = sets * reps * kg;
      totalVolume += volume;

      // Time: [(sets × reps) × tempo] + (sets - 1) × rest
      const workTime = (sets * reps * tempo) / 60; // Convert to minutes
      const restTime = (sets - 1) * rest;
      totalTimeMinutes += workTime + restTime;
    });
  });

  return {
    volume: totalVolume,
    timeMinutes: totalTimeMinutes
  };
};

export const parseRepsToTotal = (reps: string): number => {
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

export const parseTempoToSeconds = (tempo: string): number => {
  if (!tempo || tempo.trim() === '') {
    return 3;
  }
  
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

export const parseRestToMinutes = (rest: string): number => {
  if (!rest) return 0;
  
  if (rest.includes(':')) {
    const [minutes, seconds] = rest.split(':');
    return (parseInt(minutes) || 0) + (parseInt(seconds) || 0) / 60;
  } else if (rest.includes("'")) {
    return parseFloat(rest.replace("'", "")) || 0;
  } else if (rest.includes('s')) {
    return (parseFloat(rest.replace('s', '')) || 0) / 60;
  } else {
    return parseFloat(rest) || 0;
  }
};

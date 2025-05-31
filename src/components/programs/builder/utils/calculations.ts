
// Parse reps format like "1.2.1.3" to total reps (1+2+1+3 = 7)
export const parseReps = (repsString: string): number => {
  if (!repsString) return 0;
  
  // Split by dots and sum the numbers
  const parts = repsString.split('.');
  return parts.reduce((sum, part) => {
    const num = parseInt(part.trim());
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};

// Parse tempo format like "1.1.1" or "1.x.x" to total seconds
export const parseTempo = (tempoString: string): number => {
  if (!tempoString) return 0;
  
  const parts = tempoString.split('.');
  return parts.reduce((sum, part) => {
    const trimmed = part.trim().toLowerCase();
    if (trimmed === 'x') {
      return sum + 0.5; // x represents 0.5 seconds
    }
    const num = parseInt(trimmed);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};

// Parse rest format like "2:00" or "0:30" to seconds
export const parseRest = (restString: string): number => {
  if (!restString) return 0;
  
  const parts = restString.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  // If no colon, assume it's just seconds
  return parseInt(restString) || 0;
};

// Calculate volume: sets × reps × kg
export const calculateVolume = (sets: number, reps: string, kg: string): number => {
  const totalReps = parseReps(reps);
  const weight = parseFloat(kg) || 0;
  return sets * totalReps * weight;
};

// Calculate power: (kg × 9.81) × m/s = Watts
export const calculatePower = (kg: string, velocity: string): number => {
  const weight = parseFloat(kg) || 0;
  const velocityMs = parseFloat(velocity) || 0;
  return weight * 9.81 * velocityMs;
};

// Calculate time: (sets × reps × tempo) + (sets - 1) × rest
export const calculateTime = (sets: number, reps: string, tempo: string, rest: string): number => {
  const totalReps = parseReps(reps);
  const tempoSeconds = parseTempo(tempo);
  const restSeconds = parseRest(rest);
  
  const workTime = sets * totalReps * tempoSeconds;
  const restTime = (sets - 1) * restSeconds;
  
  return workTime + restTime;
};

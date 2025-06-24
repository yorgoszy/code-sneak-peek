
// Utility functions for parsing time-based reps and calculating workout durations

export const parseRepsToTime = (reps: string): { isTime: boolean; seconds: number; count: number } => {
  if (!reps) return { isTime: false, seconds: 0, count: 0 };
  
  const repsStr = reps.toString().toLowerCase().trim();
  
  // Check for time formats: 30sec, 30'', 2min, 2'
  const timeFormats = [
    { regex: /^(\d+(?:[.,]\d+)?)sec$/i, multiplier: 1 }, // 30sec
    { regex: /^(\d+(?:[.,]\d+)?)''+$/i, multiplier: 1 }, // 30''
    { regex: /^(\d+(?:[.,]\d+)?)min$/i, multiplier: 60 }, // 2min
    { regex: /^(\d+(?:[.,]\d+)?)'$/i, multiplier: 60 }, // 2'
  ];
  
  for (const format of timeFormats) {
    const match = repsStr.match(format.regex);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      return { 
        isTime: true, 
        seconds: value * format.multiplier,
        count: 0 
      };
    }
  }
  
  // If no time format matched, parse as regular reps
  if (!reps.includes('.')) {
    return { 
      isTime: false, 
      seconds: 0, 
      count: parseInt(reps) || 0 
    };
  }
  
  // Split by '.' and sum all numbers for complex reps like "1.2.1.3"
  const parts = reps.split('.');
  let totalReps = 0;
  
  parts.forEach(part => {
    totalReps += parseInt(part) || 0;
  });
  
  return { 
    isTime: false, 
    seconds: 0, 
    count: totalReps 
  };
};

export const parseTempoToSeconds = (tempo: string): number => {
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

export const parseRestTime = (rest: string): number => {
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
export const parseNumberWithComma = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  // Replace comma with dot for proper parsing
  const normalizedValue = value.toString().replace(',', '.');
  return parseFloat(normalizedValue) || 0;
};

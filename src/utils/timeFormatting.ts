/**
 * Μετατρέπει αριθμό δευτερολέπτων σε μορφή mm:ss
 * Π.χ. 1000 -> "10:00", 65 -> "01:05"
 */
export const formatSecondsToMMSS = (seconds: number | string): string => {
  const numSeconds = typeof seconds === 'string' ? parseInt(seconds) || 0 : seconds;
  const mins = Math.floor(numSeconds / 60);
  const secs = numSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Μετατρέπει μορφή mm:ss σε δευτερόλεπτα
 * Π.χ. "10:00" -> 600, "01:05" -> 65
 */
export const parseMMSSToSeconds = (mmss: string): number => {
  if (!mmss || mmss.trim() === '') return 0;
  
  // Αν είναι ήδη αριθμός, επιστρέφουμε τον
  if (/^\d+$/.test(mmss)) return parseInt(mmss);
  
  const parts = mmss.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
  }
  
  return parseInt(mmss) || 0;
};

/**
 * Μορφοποιεί την είσοδο καθώς ο χρήστης πληκτρολογεί
 * Επιτρέπει μόνο αριθμούς και αυτόματα βάζει την άνω κάτω τελεία
 */
export const formatTimeInput = (value: string): string => {
  // Αφαιρούμε όλα εκτός από αριθμούς
  const digitsOnly = value.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) return '';
  if (digitsOnly.length === 1) return digitsOnly;
  if (digitsOnly.length === 2) return digitsOnly;
  
  // Όταν έχουμε 3+ ψηφία, βάζουμε την άνω κάτω τελεία
  // Π.χ. 1000 -> 10:00, 125 -> 1:25
  const mins = digitsOnly.slice(0, -2);
  const secs = digitsOnly.slice(-2);
  
  return `${mins}:${secs}`;
};

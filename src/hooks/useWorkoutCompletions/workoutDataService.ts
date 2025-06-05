
import { format, addDays } from "date-fns";

interface WorkoutData {
  exerciseId: string;
  kg?: string;
  reps?: string;
  velocity?: string;
  notes?: string;
}

export const saveWorkoutData = (
  selectedDate: Date,
  programId: string,
  exerciseId: string,
  data: Partial<WorkoutData>
) => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const storageKey = `workout-data-${dateStr}-${programId}-${exerciseId}`;
  
  const existingData = getWorkoutData(selectedDate, programId, exerciseId);
  const newData = { ...existingData, ...data, exerciseId };
  
  localStorage.setItem(storageKey, JSON.stringify(newData));
  
  // Αποθηκεύουμε επίσης για την επόμενη εβδομάδα
  const nextWeekDate = addDays(selectedDate, 7);
  const nextWeekKey = `workout-data-${format(nextWeekDate, 'yyyy-MM-dd')}-${programId}-${exerciseId}`;
  localStorage.setItem(nextWeekKey, JSON.stringify(newData));
  
  console.log('💾 Αποθήκευση workout data για:', dateStr, 'και επόμενη εβδομάδα:', data);
};

export const getWorkoutData = (
  selectedDate: Date,
  programId: string,
  exerciseId: string
): WorkoutData => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const storageKey = `workout-data-${dateStr}-${programId}-${exerciseId}`;
  
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error parsing workout data:', error);
    }
  }
  
  // Αν δεν υπάρχει για αυτή την ημέρα, ψάχνουμε την προηγούμενη εβδομάδα
  const prevWeekDate = addDays(selectedDate, -7);
  const prevWeekKey = `workout-data-${format(prevWeekDate, 'yyyy-MM-dd')}-${programId}-${exerciseId}`;
  const prevWeekData = localStorage.getItem(prevWeekKey);
  
  if (prevWeekData) {
    try {
      const parsedData = JSON.parse(prevWeekData);
      console.log(`📝 Φόρτωση workout data από προηγούμενη εβδομάδα για άσκηση ${exerciseId}:`, parsedData);
      return parsedData;
    } catch (error) {
      console.error('Error parsing previous week data:', error);
    }
  }
  
  return { exerciseId };
};

export const clearWorkoutData = (
  selectedDate: Date,
  programId: string,
  exerciseId: string
) => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const storageKey = `workout-data-${dateStr}-${programId}-${exerciseId}`;
  localStorage.removeItem(storageKey);
  
  console.log('🗑️ Καθαρισμός workout data για:', dateStr, exerciseId);
};

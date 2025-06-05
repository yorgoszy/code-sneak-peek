
import { useState, useEffect } from 'react';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export interface RunningWorkout {
  id: string;
  assignment: EnrichedAssignment;
  selectedDate: Date;
  startTime: Date;
  elapsedTime: number;
}

export const useRunningWorkouts = () => {
  const [runningWorkouts, setRunningWorkouts] = useState<RunningWorkout[]>([]);

  // Timer για ενημέρωση του elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setRunningWorkouts(prev => 
        prev.map(workout => ({
          ...workout,
          elapsedTime: Math.floor((new Date().getTime() - workout.startTime.getTime()) / 1000)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startWorkout = (assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    
    setRunningWorkouts(prev => {
      // Αν υπάρχει ήδη, δεν το προσθέτουμε ξανά
      if (prev.some(w => w.id === workoutId)) {
        return prev;
      }
      
      return [...prev, {
        id: workoutId,
        assignment,
        selectedDate,
        startTime: new Date(),
        elapsedTime: 0
      }];
    });
  };

  const completeWorkout = (workoutId: string) => {
    setRunningWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  const cancelWorkout = (workoutId: string) => {
    setRunningWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    runningWorkouts,
    startWorkout,
    completeWorkout,
    cancelWorkout,
    formatTime
  };
};

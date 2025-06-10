
import { useState, useCallback } from 'react';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export interface ActiveWorkout {
  id: string;
  assignment: EnrichedAssignment;
  selectedDate: Date;
  startTime: Date;
  elapsedTime: number;
  workoutInProgress: boolean;
}

export const useMultipleWorkouts = () => {
  const [activeWorkouts, setActiveWorkouts] = useState<ActiveWorkout[]>([]);

  const startWorkout = useCallback((assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    
    setActiveWorkouts(prev => {
      // Αν υπάρχει ήδη, δεν το προσθέτουμε ξανά
      if (prev.some(w => w.id === workoutId)) {
        return prev.map(w => 
          w.id === workoutId 
            ? { ...w, workoutInProgress: true, startTime: new Date(), elapsedTime: 0 }
            : w
        );
      }
      
      return [...prev, {
        id: workoutId,
        assignment,
        selectedDate,
        startTime: new Date(),
        elapsedTime: 0,
        workoutInProgress: true
      }];
    });
  }, []);

  const updateElapsedTime = useCallback((workoutId: string, elapsedTime: number) => {
    setActiveWorkouts(prev => 
      prev.map(workout => 
        workout.id === workoutId 
          ? { ...workout, elapsedTime }
          : workout
      )
    );
  }, []);

  const completeWorkout = useCallback((workoutId: string) => {
    setActiveWorkouts(prev => prev.filter(w => w.id !== workoutId));
  }, []);

  const cancelWorkout = useCallback((workoutId: string) => {
    setActiveWorkouts(prev => prev.filter(w => w.id !== workoutId));
  }, []);

  const getWorkout = useCallback((workoutId: string) => {
    return activeWorkouts.find(w => w.id === workoutId);
  }, [activeWorkouts]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    activeWorkouts,
    startWorkout,
    updateElapsedTime,
    completeWorkout,
    cancelWorkout,
    getWorkout,
    formatTime
  };
};

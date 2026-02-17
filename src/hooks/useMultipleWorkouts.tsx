
import { useState, useCallback, useEffect } from 'react';
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

  // Timer: update elapsedTime every second for all active workouts
  useEffect(() => {
    if (activeWorkouts.some(w => w.workoutInProgress)) {
      const interval = setInterval(() => {
        setActiveWorkouts(prev =>
          prev.map(w =>
            w.workoutInProgress
              ? { ...w, elapsedTime: Math.floor((Date.now() - w.startTime.getTime()) / 1000) }
              : w
          )
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeWorkouts.length, activeWorkouts.some(w => w.workoutInProgress)]);

  const startWorkout = useCallback((assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    
    setActiveWorkouts(prev => {
      // Αν υπάρχει ήδη, ΔΕΝ το ξαναρχικοποιούμε - απλά το αφήνουμε ως έχει
      if (prev.some(w => w.id === workoutId)) {
        return prev;
      }
      
      return [...prev, {
        id: workoutId,
        assignment,
        selectedDate,
        startTime: new Date(),
        elapsedTime: 0,
        workoutInProgress: false
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

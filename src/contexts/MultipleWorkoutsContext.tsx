
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export interface ActiveWorkout {
  id: string;
  assignment: EnrichedAssignment;
  selectedDate: Date;
  startTime: Date;
  elapsedTime: number;
  workoutInProgress: boolean;
}

interface MultipleWorkoutsContextType {
  activeWorkouts: ActiveWorkout[];
  /** Add workout for tracking/viewing (does NOT auto-start timer) */
  openWorkout: (assignment: EnrichedAssignment, selectedDate: Date) => void;
  /** Actually start the workout timer */
  startWorkout: (assignment: EnrichedAssignment, selectedDate: Date) => void;
  updateElapsedTime: (workoutId: string, elapsedTime: number) => void;
  completeWorkout: (workoutId: string) => void;
  cancelWorkout: (workoutId: string) => void;
  /** Remove workout from tracking without cancel toast */
  removeWorkout: (workoutId: string) => void;
  getWorkout: (workoutId: string) => ActiveWorkout | undefined;
  formatTime: (seconds: number) => string;
}

const MultipleWorkoutsContext = createContext<MultipleWorkoutsContextType | null>(null);

export const MultipleWorkoutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkouts, setActiveWorkouts] = useState<ActiveWorkout[]>([]);
  const activeWorkoutsRef = useRef(activeWorkouts);
  activeWorkoutsRef.current = activeWorkouts;

  // Timer: update elapsedTime every second for all active workouts
  useEffect(() => {
    const hasActive = activeWorkouts.some(w => w.workoutInProgress);
    if (!hasActive) return;

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
  }, [activeWorkouts.some(w => w.workoutInProgress)]);

  /** Add workout for tracking/viewing only - does NOT start timer */
  const openWorkout = useCallback((assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    
    setActiveWorkouts(prev => {
      if (prev.some(w => w.id === workoutId)) {
        return prev; // Already tracked
      }
      
      return [...prev, {
        id: workoutId,
        assignment,
        selectedDate,
        startTime: new Date(),
        elapsedTime: 0,
        workoutInProgress: false // NOT auto-started
      }];
    });
  }, []);

  /** Actually start the workout timer */
  const startWorkout = useCallback((assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    
    setActiveWorkouts(prev => {
      const existing = prev.find(w => w.id === workoutId);
      if (existing) {
        // Already tracked - just set workoutInProgress to true if not already
        if (existing.workoutInProgress) return prev;
        return prev.map(w => 
          w.id === workoutId 
            ? { ...w, workoutInProgress: true, startTime: new Date(), elapsedTime: 0 }
            : w
        );
      }
      
      // New workout - add and start
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

  const removeWorkout = useCallback((workoutId: string) => {
    setActiveWorkouts(prev => prev.filter(w => w.id !== workoutId));
  }, []);

  const getWorkout = useCallback((workoutId: string) => {
    return activeWorkoutsRef.current.find(w => w.id === workoutId);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <MultipleWorkoutsContext.Provider value={{
      activeWorkouts,
      openWorkout,
      startWorkout,
      updateElapsedTime,
      completeWorkout,
      cancelWorkout,
      removeWorkout,
      getWorkout,
      formatTime
    }}>
      {children}
    </MultipleWorkoutsContext.Provider>
  );
};

export const useMultipleWorkouts = () => {
  const context = useContext(MultipleWorkoutsContext);
  if (!context) {
    throw new Error('useMultipleWorkouts must be used within a MultipleWorkoutsProvider');
  }
  return context;
};

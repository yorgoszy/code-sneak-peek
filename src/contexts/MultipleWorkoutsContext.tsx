
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

/** Composite workout id: `${assignment.id}__${yyyy-MM-dd}`.
 *  Επιτρέπει διαφορετικό bubble για κάθε (assignment, ημερομηνία). */
export const makeWorkoutId = (assignmentId: string, date: Date | string): string => {
  const dateKey =
    typeof date === 'string' ? date.slice(0, 10) : format(date, 'yyyy-MM-dd');
  return `${assignmentId}__${dateKey}`;
};

export const parseWorkoutId = (workoutId: string): { assignmentId: string; date: string } => {
  const idx = workoutId.lastIndexOf('__');
  if (idx === -1) return { assignmentId: workoutId, date: '' };
  return { assignmentId: workoutId.slice(0, idx), date: workoutId.slice(idx + 2) };
};

export interface ActiveWorkout {
  id: string;
  assignment: EnrichedAssignment;
  selectedDate: Date;
  startedDate?: Date;
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
  /** Update the selectedDate of an existing workout without changing its id (dialog stays mounted) */
  updateWorkoutDate: (workoutId: string, newDate: Date) => void;
  /** Restore dialog date to the date where the workout timer was started */
  resetWorkoutToStartedDate: (workoutId: string) => void;
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

  /** Add workout for tracking/viewing only - does NOT start timer.
   * ΕΝΑ workout ανά assignment/user. Αν πατηθεί άλλη ημερομηνία, αλλάζει το ίδιο bubble. */
  const openWorkout = useCallback((assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = makeWorkoutId(assignment.id, selectedDate);

    setActiveWorkouts(prev => {
      const existing = prev.find(w => w.assignment.id === assignment.id);
      if (existing) {
        // Ίδιος χρήστης/assignment: κρατάμε ένα bubble και αλλάζουμε ημερομηνία/id
        return [
          ...prev.filter(w => w.assignment.id !== assignment.id),
          { ...existing, id: workoutId, assignment, selectedDate }
        ];
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

  /** Actually start the workout timer */
  const startWorkout = useCallback((assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = makeWorkoutId(assignment.id, selectedDate);

    setActiveWorkouts(prev => {
      const existing = prev.find(w => w.assignment.id === assignment.id);
      if (existing) {
        const updated = existing.workoutInProgress
          ? { ...existing, id: workoutId, assignment, selectedDate }
          : { ...existing, id: workoutId, assignment, workoutInProgress: true, startTime: new Date(), elapsedTime: 0, selectedDate, startedDate: selectedDate };
        return [...prev.filter(w => w.assignment.id !== assignment.id), updated];
      }

      return [...prev, {
        id: workoutId,
        assignment,
        selectedDate,
        startedDate: selectedDate,
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

  const updateWorkoutDate = useCallback((workoutId: string, newDate: Date) => {
    setActiveWorkouts(prev =>
      prev.reduce<ActiveWorkout[]>((acc, workout) => {
        if (workout.id !== workoutId) {
          acc.push(workout);
          return acc;
        }

        const nextId = makeWorkoutId(workout.assignment.id, newDate);
        const updated = { ...workout, id: nextId, selectedDate: newDate };
        return [...acc.filter(w => w.assignment.id !== workout.assignment.id), updated];
      }, [])
    );
  }, []);

  const resetWorkoutToStartedDate = useCallback((workoutId: string) => {
    setActiveWorkouts(prev =>
      prev.map(workout =>
        workout.id === workoutId && workout.workoutInProgress && workout.startedDate
          ? { ...workout, selectedDate: workout.startedDate }
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
      updateWorkoutDate,
      resetWorkoutToStartedDate,
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

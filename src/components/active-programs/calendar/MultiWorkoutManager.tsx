
import React, { useState, useEffect } from 'react';
import { DayProgramDialog } from './DayProgramDialog';
import { useMultipleWorkouts } from '@/hooks/useMultipleWorkouts';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface MultiWorkoutManagerProps {
  onRefresh?: () => void;
}

export const MultiWorkoutManager: React.FC<MultiWorkoutManagerProps> = ({ onRefresh }) => {
  const { activeWorkouts, updateElapsedTime } = useMultipleWorkouts();
  const [openDialogs, setOpenDialogs] = useState<Set<string>>(new Set());

  // Timer για ενημέρωση του elapsed time για όλες τις ενεργές προπονήσεις
  useEffect(() => {
    const interval = setInterval(() => {
      activeWorkouts.forEach(workout => {
        if (workout.workoutInProgress) {
          const newElapsedTime = Math.floor((new Date().getTime() - workout.startTime.getTime()) / 1000);
          updateElapsedTime(workout.id, newElapsedTime);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkouts, updateElapsedTime]);

  const handleDialogClose = (workoutId: string) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(workoutId);
      return newSet;
    });
  };

  const openDialog = (assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    setOpenDialogs(prev => new Set(prev).add(workoutId));
  };

  // Εξάγουμε τη συνάρτηση για χρήση από άλλα components
  React.useImperativeHandle(React.createRef(), () => ({
    openDialog
  }));

  return (
    <>
      {activeWorkouts.map(workout => (
        <DayProgramDialog
          key={workout.id}
          isOpen={openDialogs.has(workout.id)}
          onClose={() => handleDialogClose(workout.id)}
          program={workout.assignment}
          selectedDate={workout.selectedDate}
          workoutStatus="scheduled"
          onRefresh={onRefresh}
        />
      ))}
    </>
  );
};

// Export για χρήση από άλλα components
export const useMultiWorkoutManager = () => {
  const { activeWorkouts, openWorkout } = useMultipleWorkouts();
  const [openDialogs, setOpenDialogs] = useState<Set<string>>(new Set());

  const openWorkoutDialog = (assignment: EnrichedAssignment, selectedDate: Date) => {
    const workoutId = `${assignment.id}-${selectedDate.toISOString().split('T')[0]}`;
    setOpenDialogs(prev => new Set(prev).add(workoutId));
    openWorkout(assignment, selectedDate);
  };

  const closeWorkoutDialog = (workoutId: string) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(workoutId);
      return newSet;
    });
  };

  return {
    activeWorkouts,
    openDialogs,
    openWorkoutDialog,
    closeWorkoutDialog
  };
};

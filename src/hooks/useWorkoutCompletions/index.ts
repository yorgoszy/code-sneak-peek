
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { completeWorkout, updateWorkoutStatus, markMissedWorkouts, getWorkoutCompletions } from "./workoutService";
import { saveExerciseResults, getExerciseResults } from "./exerciseService";
import { getAssignmentAttendance } from "./attendanceService";

export * from "./types";

export const useWorkoutCompletions = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCompleteWorkout = async (
    assignmentId: string,
    programId: string,
    weekNumber: number,
    dayNumber: number,
    scheduledDate: string,
    notes?: string,
    startTime?: Date,
    endTime?: Date,
    actualDurationMinutes?: number,
    rpeScore?: number
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      return await completeWorkout(
        assignmentId,
        programId,
        weekNumber,
        dayNumber,
        scheduledDate,
        user.id,
        notes,
        startTime,
        endTime,
        actualDurationMinutes,
        rpeScore
      );
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkoutStatus = async (
    assignmentId: string,
    scheduledDate: string,
    status: 'completed' | 'missed' | 'makeup' | 'pending' | 'cancelled',
    statusColor: string
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      return await updateWorkoutStatus(assignmentId, scheduledDate, status, statusColor, user.id);
    } catch (error) {
      console.error('Error in updateWorkoutStatus:', error);
      throw error;
    }
  };

  return {
    loading,
    completeWorkout: handleCompleteWorkout,
    saveExerciseResults,
    getExerciseResults,
    updateWorkoutStatus: handleUpdateWorkoutStatus,
    markMissedWorkouts,
    getAssignmentAttendance,
    getWorkoutCompletions
  };
};

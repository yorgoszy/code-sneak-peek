
import { useState, useEffect, useRef } from 'react';
import { format, addDays } from "date-fns";
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export const useWorkoutState = (
  program: EnrichedAssignment | null,
  selectedDate: Date | null,
  onRefresh?: () => void,
  onClose?: () => void
) => {
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { completeWorkout, loading } = useWorkoutCompletions();
  
  const { 
    completeSet, 
    getRemainingText, 
    isExerciseComplete,
    updateNotes,
    clearNotes,
    getNotes,
    updateKg,
    clearKg,
    updateVelocity,
    clearVelocity,
    updateReps,
    clearReps,
    getAdjustments
  } = useExerciseCompletion();

  // Function to initialize workout state (for restored minimized programs)
  const initializeWorkoutState = (inProgress: boolean, start: Date | null, elapsed: number) => {
    console.log('🔄 Initializing workout state:', { inProgress, start, elapsed });
    setWorkoutInProgress(inProgress);
    setStartTime(start);
    setElapsedTime(elapsed);
  };

  // Timer effect - fixed to prevent stopping when minimized
  useEffect(() => {
    if (workoutInProgress && startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTime.getTime()) / 1000);
        setElapsedTime(currentElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [workoutInProgress, startTime]);

  const handleStartWorkout = () => {
    console.log('🏋️‍♂️ Έναρξη προπόνησης για ημερομηνία:', format(selectedDate!, 'dd/MM/yyyy'));
    const now = new Date();
    setWorkoutInProgress(true);
    setStartTime(now);
    setElapsedTime(0);
  };

  const transferDataToNextWeek = () => {
    if (!program || !selectedDate) return;

    console.log('📝 Μεταφορά δεδομένων στην επόμενη εβδομάδα...');
    
    const nextWeekDate = addDays(selectedDate, 7);
    const nextWeekDateStr = format(nextWeekDate, 'yyyy-MM-dd');
    
    const trainingDates = program.training_dates || [];
    const nextWeekExists = trainingDates.includes(nextWeekDateStr);
    
    if (!nextWeekExists) {
      console.log('✅ Το πρόγραμμα έχει ολοκληρωθεί - δεν μεταφέρονται δεδομένα');
      return;
    }

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
    
    if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
      const programDays = program.programs.program_weeks[0].program_days;
      const dayProgram = programDays[dateIndex % programDays.length];
      
      if (dayProgram?.program_blocks) {
        dayProgram.program_blocks.forEach(block => {
          if (block.program_exercises) {
            block.program_exercises.forEach(exercise => {
              const currentNotes = getNotes(exercise.id);
              const currentAdjustments = getAdjustments(exercise.id);
              
              const nextWeekExerciseKey = `${nextWeekDateStr}-${exercise.id}`;
              
              if (currentNotes && currentNotes.trim()) {
                updateNotes(nextWeekExerciseKey, currentNotes);
                localStorage.setItem(`exercise-notes-${nextWeekExerciseKey}`, currentNotes);
              }
              
              if (currentAdjustments.kg) {
                updateKg(nextWeekExerciseKey, currentAdjustments.kg);
                localStorage.setItem(`exercise-kg-${nextWeekExerciseKey}`, currentAdjustments.kg);
              }
              
              if (currentAdjustments.velocity) {
                updateVelocity(nextWeekExerciseKey, currentAdjustments.velocity);
                localStorage.setItem(`exercise-velocity-${nextWeekExerciseKey}`, currentAdjustments.velocity.toString());
              }
              
              if (currentAdjustments.reps) {
                updateReps(nextWeekExerciseKey, currentAdjustments.reps);
                localStorage.setItem(`exercise-reps-${nextWeekExerciseKey}`, currentAdjustments.reps.toString());
              }
            });
          }
        });
      }
    }
    
    console.log('✅ Μεταφορά όλων των δεδομένων ολοκληρώθηκε');
  };

  const handleCompleteWorkout = async () => {
    if (!program || !selectedDate || !startTime) {
      console.error('❌ Missing required data for workout completion');
      return;
    }

    try {
      console.log('✅ Ολοκλήρωση προπόνησης');
      
      transferDataToNextWeek();
      
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      const scheduledDate = format(selectedDate, 'yyyy-MM-dd');
      
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      const trainingDates = program.training_dates || [];
      const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
      
      if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
        const programDays = program.programs.program_weeks[0].program_days;
        const dayProgram = programDays[dateIndex % programDays.length];
        
        if (dayProgram) {
          await completeWorkout(
            program.id,
            program.program_id,
            1,
            dayProgram.day_number,
            scheduledDate,
            undefined,
            startTime,
            endTime,
            durationMinutes
          );
          
          console.log('✅ Workout completion saved successfully');
          
          // Reset workout state
          setWorkoutInProgress(false);
          setStartTime(null);
          setElapsedTime(0);
          
          if (onRefresh) {
            console.log('🔄 Triggering data refresh after workout completion');
            await onRefresh();
          }
          
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error) {
      console.error('❌ Error completing workout:', error);
    }
  };

  const handleCancelWorkout = () => {
    console.log('❌ Ακύρωση προπόνησης');
    setWorkoutInProgress(false);
    setStartTime(null);
    setElapsedTime(0);
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Get current workout state for minimizing
  const getCurrentWorkoutState = () => {
    if (!workoutInProgress) return undefined;
    
    return {
      workoutInProgress,
      startTime,
      elapsedTime
    };
  };

  return {
    workoutInProgress,
    startTime,
    elapsedTime,
    loading,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    initializeWorkoutState,
    getCurrentWorkoutState,
    exerciseCompletion: {
      completeSet,
      getRemainingText,
      isExerciseComplete,
      updateNotes,
      clearNotes,
      getNotes,
      updateKg,
      clearKg,
      updateVelocity,
      clearVelocity,
      updateReps,
      clearReps,
      getAdjustments
    }
  };
};

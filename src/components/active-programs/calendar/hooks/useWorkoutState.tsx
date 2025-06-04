
import { useState, useEffect } from 'react';
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutInProgress && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutInProgress, startTime]);

  const handleStartWorkout = () => {
    console.log('🏋️‍♂️ Έναρξη προπόνησης για ημερομηνία:', format(selectedDate!, 'dd/MM/yyyy'));
    setWorkoutInProgress(true);
    setStartTime(new Date());
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
          
          setWorkoutInProgress(false);
          setStartTime(null);
          setElapsedTime(0);
          
          if (onRefresh) {
            console.log('🔄 Triggering data refresh after workout completion');
            onRefresh();
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
  };

  return {
    workoutInProgress,
    startTime,
    elapsedTime,
    loading,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
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

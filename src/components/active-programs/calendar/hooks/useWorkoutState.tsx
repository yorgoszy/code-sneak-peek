
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
import { saveWorkoutData, getWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { useRunningWorkouts } from '@/hooks/useRunningWorkouts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UseWorkoutStateProps {
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const useWorkoutState = (
  program: EnrichedAssignment | null,
  selectedDate: Date | null,
  onRefresh?: () => void,
  onClose?: () => void
) => {
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exerciseCompletions, setExerciseCompletions] = useState<Record<string, number>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [exerciseData, setExerciseData] = useState<Record<string, any>>({});
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);

  const { updateWorkoutStatus } = useWorkoutCompletions();
  const { startWorkout: addToRunningWorkouts, completeWorkout: removeFromRunningWorkouts } = useRunningWorkouts();

  // Φόρτωση δεδομένων από localStorage όταν ανοίγει το dialog
  useEffect(() => {
    if (program && selectedDate) {
      const loadExerciseData = () => {
        const newExerciseData: Record<string, any> = {};
        const newExerciseNotes: Record<string, string> = {};
        
        program.programs?.program_weeks?.[0]?.program_days?.forEach(day => {
          day.program_blocks?.forEach(block => {
            block.program_exercises?.forEach(exercise => {
              const data = getWorkoutData(selectedDate, program.programs!.id, exercise.id);
              if (data.kg || data.reps || data.velocity) {
                newExerciseData[exercise.id] = data;
              }
              if (data.notes) {
                newExerciseNotes[exercise.id] = data.notes;
              }
            });
          });
        });
        
        setExerciseData(newExerciseData);
        setExerciseNotes(newExerciseNotes);
      };
      
      loadExerciseData();
    }
  }, [program, selectedDate]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutInProgress) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workoutInProgress]);

  const handleStartWorkout = useCallback(() => {
    if (!program || !selectedDate) return;
    
    console.log('🏋️‍♂️ Έναρξη προπόνησης');
    setWorkoutInProgress(true);
    setElapsedTime(0);
    setWorkoutStartTime(new Date());
    
    // Προσθήκη στο running workouts
    addToRunningWorkouts(program, selectedDate);
    
    toast.success('Προπόνηση ξεκίνησε!');
  }, [program, selectedDate, addToRunningWorkouts]);

  const handleCompleteWorkout = useCallback(async () => {
    if (!program || !selectedDate || !workoutStartTime) return;

    try {
      console.log('✅ ΟΛΟΚΛΗΡΩΣΗ ΠΡΟΠΟΝΗΣΗΣ');
      
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('🔄 Updating workout completion:', {
        assignment_id: program.id,
        scheduled_date: selectedDateStr
      });

      // Βρίσκουμε τη σωστή εβδομάδα και ημέρα
      const trainingDates = program.training_dates || [];
      const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
      
      if (dateIndex === -1) {
        throw new Error('Training date not found in assignment');
      }

      // Υπολογίζουμε week_number και day_number
      const programDays = program.programs?.program_weeks?.[0]?.program_days || [];
      const daysPerWeek = programDays.length;
      const weekNumber = Math.floor(dateIndex / daysPerWeek) + 1;
      const dayNumber = (dateIndex % daysPerWeek) + 1;
      
      // Δημιουργούμε ή ενημερώνουμε το workout completion record
      const { data: existingCompletion, error: fetchError } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('assignment_id', program.id)
        .eq('scheduled_date', selectedDateStr)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching existing completion:', fetchError);
        throw fetchError;
      }

      let result;
      if (existingCompletion) {
        // Update existing record
        const { data, error } = await supabase
          .from('workout_completions')
          .update({
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', existingCompletion.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new record with all required fields
        const { data, error } = await supabase
          .from('workout_completions')
          .insert({
            assignment_id: program.id,
            user_id: program.app_users?.id || program.user_id,
            program_id: program.programs?.id || program.program_id,
            week_number: weekNumber,
            day_number: dayNumber,
            scheduled_date: selectedDateStr,
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }
      
      console.log('✅ Workout completion saved successfully:', result);
      
      setWorkoutInProgress(false);
      
      // Αφαίρεση από το running workouts
      const workoutId = `${program.id}-${selectedDateStr}`;
      removeFromRunningWorkouts(workoutId);
      
      toast.success('Προπόνηση ολοκληρώθηκε!');
      
      // ΑΜΕΣΗ ανανέωση
      if (onRefresh) {
        console.log('🔄 TRIGGERING IMMEDIATE REFRESH...');
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
      
      // Κλείνουμε το dialog μετά από μικρή καθυστέρηση
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error completing workout:', error);
      toast.error('Σφάλμα κατά την ολοκλήρωση της προπόνησης');
    }
  }, [program, selectedDate, workoutStartTime, onRefresh, onClose, removeFromRunningWorkouts]);

  const handleCancelWorkout = useCallback(() => {
    if (!program || !selectedDate) return;
    
    console.log('❌ Ακύρωση προπόνησης');
    setWorkoutInProgress(false);
    setElapsedTime(0);
    setExerciseCompletions({});
    setExerciseNotes({});
    setExerciseData({});
    setWorkoutStartTime(null);
    
    // Αφαίρεση από το running workouts
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const workoutId = `${program.id}-${selectedDateStr}`;
    removeFromRunningWorkouts(workoutId);
    
    toast.info('Προπόνηση ακυρώθηκε');
  }, [program, selectedDate, removeFromRunningWorkouts]);

  const exerciseCompletion = {
    completeSet: (exerciseId: string, totalSets: number) => {
      setExerciseCompletions(prev => {
        const current = prev[exerciseId] || 0;
        const newCount = Math.min(current + 1, totalSets);
        console.log(`Set completed for exercise ${exerciseId}: ${newCount}/${totalSets}`);
        return { ...prev, [exerciseId]: newCount };
      });
    },

    getRemainingText: (exerciseId: string, totalSets: number) => {
      const completed = exerciseCompletions[exerciseId] || 0;
      const remaining = totalSets - completed;
      return remaining > 0 ? `${remaining} sets remaining` : 'Complete!';
    },

    isExerciseComplete: (exerciseId: string, totalSets: number) => {
      const completed = exerciseCompletions[exerciseId] || 0;
      return completed >= totalSets;
    },

    getNotes: (exerciseId: string) => {
      return exerciseNotes[exerciseId] || '';
    },

    updateNotes: (exerciseId: string, notes: string) => {
      setExerciseNotes(prev => ({ ...prev, [exerciseId]: notes }));
      if (program && selectedDate) {
        saveWorkoutData(selectedDate, program.programs!.id, exerciseId, { notes });
      }
    },

    clearNotes: (exerciseId: string) => {
      setExerciseNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[exerciseId];
        return newNotes;
      });
      if (program && selectedDate) {
        clearWorkoutData(selectedDate, program.programs!.id, exerciseId);
      }
    },

    updateKg: (exerciseId: string, kg: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], kg }
      }));
      if (program && selectedDate) {
        saveWorkoutData(selectedDate, program.programs!.id, exerciseId, { kg });
      }
    },

    clearKg: (exerciseId: string) => {
      setExerciseData(prev => {
        const newData = { ...prev };
        if (newData[exerciseId]) {
          delete newData[exerciseId].kg;
        }
        return newData;
      });
    },

    updateVelocity: (exerciseId: string, velocity: number) => {
      const velocityStr = velocity.toString();
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], velocity: velocityStr }
      }));
      if (program && selectedDate) {
        saveWorkoutData(selectedDate, program.programs!.id, exerciseId, { velocity: velocityStr });
      }
    },

    clearVelocity: (exerciseId: string) => {
      setExerciseData(prev => {
        const newData = { ...prev };
        if (newData[exerciseId]) {
          delete newData[exerciseId].velocity;
        }
        return newData;
      });
    },

    updateReps: (exerciseId: string, reps: number) => {
      const repsStr = reps.toString();
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], reps: repsStr }
      }));
      if (program && selectedDate) {
        saveWorkoutData(selectedDate, program.programs!.id, exerciseId, { reps: repsStr });
      }
    },

    clearReps: (exerciseId: string) => {
      setExerciseData(prev => {
        const newData = { ...prev };
        if (newData[exerciseId]) {
          delete newData[exerciseId].reps;
        }
        return newData;
      });
    }
  };

  return {
    workoutInProgress,
    elapsedTime,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    exerciseCompletion
  };
};

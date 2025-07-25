
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
import { saveWorkoutData, getWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { useMultipleWorkouts } from '@/hooks/useMultipleWorkouts';
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
  const [exerciseCompletions, setExerciseCompletions] = useState<Record<string, number>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [exerciseData, setExerciseData] = useState<Record<string, any>>({});

  const { updateWorkoutStatus } = useWorkoutCompletions();
  const { startWorkout, completeWorkout: removeFromActiveWorkouts, getWorkout } = useMultipleWorkouts();

  // Δημιουργία unique ID για την προπόνηση
  const workoutId = program && selectedDate 
    ? `${program.id}-${selectedDate.toISOString().split('T')[0]}`
    : null;

  // Παίρνουμε τα στοιχεία της προπόνησης από το multi-workout manager
  const currentWorkout = workoutId ? getWorkout(workoutId) : null;
  const workoutInProgress = currentWorkout?.workoutInProgress || false;
  const elapsedTime = currentWorkout?.elapsedTime || 0;

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

  const handleStartWorkout = useCallback(() => {
    if (!program || !selectedDate) return;
    
    console.log('🏋️‍♂️ Έναρξη προπόνησης για:', program.app_users?.name);
    startWorkout(program, selectedDate);
    toast.success(`Προπόνηση ξεκίνησε για ${program.app_users?.name}!`);
  }, [program, selectedDate, startWorkout]);

  const handleCompleteWorkout = useCallback(async () => {
    if (!program || !selectedDate || !currentWorkout) return;

    try {
      console.log('✅ ΟΛΟΚΛΗΡΩΣΗ ΠΡΟΠΟΝΗΣΗΣ για:', program.app_users?.name);
      
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Υπολογισμός διάρκειας από το χρονόμετρο
      const actualDurationMinutes = Math.round(elapsedTime / 60);
      
      console.log('🔄 Updating workout completion:', {
        assignment_id: program.id,
        scheduled_date: selectedDateStr,
        user_id: program.app_users?.id || program.user_id,
        actual_duration_minutes: actualDurationMinutes
      });

      // Χρήση του service για να γίνει upsert αντί για update μόνο
      await updateWorkoutStatus(
        program.id,
        selectedDateStr,
        'completed',
        'green'
      );

      console.log('🔄 Now updating with duration and end time...');
      
      // Τώρα ενημερώνουμε την εγγραφή με τη διάρκεια και το end_time
      const { error } = await supabase
        .from('workout_completions')
        .update({
          actual_duration_minutes: actualDurationMinutes,
          end_time: new Date().toISOString()
        })
        .eq('assignment_id', program.id)
        .eq('scheduled_date', selectedDateStr);

      if (error) {
        console.error('❌ Error updating workout completion with duration:', error);
        throw error;
      }
      
      console.log('✅ Workout completion updated successfully with duration:', actualDurationMinutes, 'minutes');
      
      // Αφαίρεση από τις ενεργές προπονήσεις
      if (workoutId) {
        removeFromActiveWorkouts(workoutId);
      }
      
      toast.success(`Προπόνηση ολοκληρώθηκε για ${program.app_users?.name}! Διάρκεια: ${actualDurationMinutes} λεπτά`);
      
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
      toast.error(`Σφάλμα κατά την ολοκλήρωση της προπόνησης για ${program.app_users?.name}: ${(error as Error).message}`);
    }
  }, [program, selectedDate, currentWorkout, elapsedTime, onRefresh, onClose, removeFromActiveWorkouts, workoutId]);

  const handleCancelWorkout = useCallback(() => {
    if (!program || !selectedDate || !workoutId) return;
    
    console.log('❌ Ακύρωση προπόνησης για:', program.app_users?.name);
    setExerciseCompletions({});
    setExerciseNotes({});
    setExerciseData({});
    
    // Αφαίρεση από τις ενεργές προπονήσεις
    removeFromActiveWorkouts(workoutId);
    
    toast.info(`Προπόνηση ακυρώθηκε για ${program.app_users?.name}`);
  }, [program, selectedDate, workoutId, removeFromActiveWorkouts]);

  // Exercise completion functions - FIXED signatures to match component expectations
  const exerciseCompletion = {
    completeSet: (exerciseId: string, totalSets: number) => {
      setExerciseCompletions(prev => {
        const current = prev[exerciseId] || 0;
        const newCount = Math.min(current + 1, totalSets);
        console.log(`Set completed for exercise ${exerciseId}: ${newCount}/${totalSets}`);
        return { ...prev, [exerciseId]: newCount };
      });
    },

    // FIXED: Changed signature to match component expectations - only exerciseId parameter
    getRemainingText: (exerciseId: string) => {
      const completed = exerciseCompletions[exerciseId] || 0;
      return completed > 0 ? ' ✅' : '';
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

    // FIXED: Changed signature to accept string parameter to match component expectations
    updateVelocity: (exerciseId: string, velocity: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], velocity }
      }));
      if (program && selectedDate) {
        saveWorkoutData(selectedDate, program.programs!.id, exerciseId, { velocity });
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

    // FIXED: Changed signature to accept string parameter to match component expectations
    updateReps: (exerciseId: string, reps: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], reps }
      }));
      if (program && selectedDate) {
        saveWorkoutData(selectedDate, program.programs!.id, exerciseId, { reps });
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

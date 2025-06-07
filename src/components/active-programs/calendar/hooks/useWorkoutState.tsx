
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
import { saveWorkoutData, getWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { useRunningWorkouts } from '@/hooks/useRunningWorkouts';
import { toast } from 'sonner';
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
      // Φορτώνουμε τα δεδομένα για όλες τις ασκήσεις
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
      console.log('✅ ΟΛΟΚΛΗΡΩΣΗ ΠΡΟΠΟΝΗΣΗΣ - ENHANCED');
      
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - workoutStartTime.getTime()) / 60000);
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

      // CRITICAL: Ενημερώνουμε το status της προπόνησης με άμεση ανανέωση
      console.log('🔄 Updating workout status to COMPLETED...');
      await updateWorkoutStatus(
        program.id,
        selectedDateStr,
        'completed',
        'green'
      );
      
      console.log('💾 Προπόνηση ΟΛΟΚΛΗΡΩΘΗΚΕ - Status updated to COMPLETED');
      
      setWorkoutInProgress(false);
      
      // Αφαίρεση από το running workouts
      const workoutId = `${program.id}-${selectedDateStr}`;
      removeFromRunningWorkouts(workoutId);
      
      toast.success('Προπόνηση ολοκληρώθηκε!');
      
      // CRITICAL: ΑΜΕΣΗ και ΕΠΙΘΕΤΙΚΗ ανανέωση
      if (onRefresh) {
        console.log('🔄 FORCING IMMEDIATE REFRESH AFTER COMPLETION...');
        // Καλούμε το refresh άμεσα χωρίς καθυστέρηση
        onRefresh();
        
        // Και επιπλέον καλούμε ξανά μετά από λίγο για σιγουριά
        setTimeout(() => {
          console.log('🔄 SECOND FORCE REFRESH AFTER COMPLETION...');
          onRefresh();
        }, 100);
        
        // Τρίτη κλήση για απόλυτη σιγουριά
        setTimeout(() => {
          console.log('🔄 THIRD FORCE REFRESH AFTER COMPLETION...');
          onRefresh();
        }, 500);
      }
      
      // Κλείνουμε το dialog μετά από μικρή καθυστέρηση
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error completing workout:', error);
      toast.error('Σφάλμα κατά την ολοκλήρωση της προπόνησης');
    }
  }, [program, selectedDate, workoutStartTime, updateWorkoutStatus, onRefresh, onClose, removeFromRunningWorkouts]);

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

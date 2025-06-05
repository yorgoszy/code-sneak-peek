
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
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
    console.log('🏋️‍♂️ Έναρξη προπόνησης');
    setWorkoutInProgress(true);
    setElapsedTime(0);
    setWorkoutStartTime(new Date());
    toast.success('Προπόνηση ξεκίνησε!');
  }, []);

  const handleCompleteWorkout = useCallback(async () => {
    if (!program || !selectedDate || !workoutStartTime) return;

    try {
      console.log('✅ Ολοκλήρωση προπόνησης');
      
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - workoutStartTime.getTime()) / 60000);
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

      // Ενημερώνουμε το status της προπόνησης
      await updateWorkoutStatus(
        program.id, // assignment_id
        selectedDateStr,
        'completed',
        'green'
      );

      console.log('💾 Προπόνηση ολοκληρώθηκε επιτυχώς');
      
      setWorkoutInProgress(false);
      toast.success('Προπόνηση ολοκληρώθηκε!');
      
      // Άμεσο refresh για να δούμε τις αλλαγές
      if (onRefresh) {
        console.log('🔄 Triggering immediate refresh...');
        onRefresh();
      }
      
      // Κλείνουμε το dialog μετά από μικρή καθυστέρηση για να φανεί το success message
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error('Σφάλμα κατά την ολοκλήρωση της προπόνησης');
    }
  }, [program, selectedDate, workoutStartTime, updateWorkoutStatus, onRefresh, onClose]);

  const handleCancelWorkout = useCallback(() => {
    console.log('❌ Ακύρωση προπόνησης');
    setWorkoutInProgress(false);
    setElapsedTime(0);
    setExerciseCompletions({});
    setExerciseNotes({});
    setExerciseData({});
    setWorkoutStartTime(null);
    toast.info('Προπόνηση ακυρώθηκε');
  }, []);

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
    },

    clearNotes: (exerciseId: string) => {
      setExerciseNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[exerciseId];
        return newNotes;
      });
    },

    updateKg: (exerciseId: string, kg: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], kg }
      }));
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
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], velocity: velocity.toString() }
      }));
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
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], reps: reps.toString() }
      }));
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

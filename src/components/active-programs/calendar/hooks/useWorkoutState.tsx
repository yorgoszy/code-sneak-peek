
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
import { saveWorkoutData, getWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { useMultipleWorkouts } from '@/hooks/useMultipleWorkouts';
import { useSharedExerciseNotes } from '@/hooks/useSharedExerciseNotes';
import { useBlockTimer } from '@/contexts/BlockTimerContext';
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
  const [exerciseData, setExerciseData] = useState<Record<string, any>>({});

  const { updateWorkoutStatus } = useWorkoutCompletions();
  const { startWorkout, completeWorkout: removeFromActiveWorkouts, getWorkout } = useMultipleWorkouts();
  const { clearAllStates: clearBlockTimerStates } = useBlockTimer();
  
  // Use shared exercise notes hook
  const sharedNotes = useSharedExerciseNotes(program?.id);

  // Helper function to get day number for an exercise
  const getDayNumber = useCallback((exerciseId: string) => {
    if (!program?.programs?.program_weeks?.[0]?.program_days) return 1;
    
    for (let dayIndex = 0; dayIndex < program.programs.program_weeks[0].program_days.length; dayIndex++) { 
      const day = program.programs.program_weeks[0].program_days[dayIndex];
      const hasExercise = day.program_blocks?.some(block => 
        block.program_exercises?.some(ex => ex.id === exerciseId)
      );
      if (hasExercise) {
        return dayIndex + 1; // Convert to 1-based index
      }
    }
    return 1;
  }, [program]);

  // Helper function to get exercise_id from exercises table (not program_exercise_id)
  const getExerciseId = useCallback((programExerciseId: string) => {
    if (!program?.programs?.program_weeks?.[0]?.program_days) return null;
    
    for (const day of program.programs.program_weeks[0].program_days) {
      for (const block of day.program_blocks || []) {
        for (const exercise of block.program_exercises || []) {
          if (exercise.id === programExerciseId) {
            return exercise.exercise_id; // This is the reference to exercises table
          }
        }
      }
    }
    return null;
  }, [program]);

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
        
        program.programs?.program_weeks?.[0]?.program_days?.forEach(day => {
          day.program_blocks?.forEach(block => {
            block.program_exercises?.forEach(exercise => {
              const data = getWorkoutData(selectedDate, program.programs!.id, exercise.id);
              if (data.kg || data.reps || data.velocity) {
                newExerciseData[exercise.id] = data;
              }
            });
          });
        });
        
        setExerciseData(newExerciseData);
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

  // Helper function to map training_type to stats categories
  // 6 categories: strength, endurance, power, speed, hypertrophy, accessory
  const mapTrainingType = (trainingType: string | null): { strength: number; endurance: number; power: number; speed: number; hypertrophy: number; accessory: number } | null => {
    if (!trainingType) return null;
    const type = trainingType.toLowerCase().trim();
    
    // Single types
    if (type === 'str' || type === 'strength') return { strength: 1, endurance: 0, power: 0, speed: 0, hypertrophy: 0, accessory: 0 };
    if (type === 'end' || type === 'endurance') return { strength: 0, endurance: 1, power: 0, speed: 0, hypertrophy: 0, accessory: 0 };
    if (type === 'pwr' || type === 'power') return { strength: 0, endurance: 0, power: 1, speed: 0, hypertrophy: 0, accessory: 0 };
    if (type === 'spd' || type === 'speed') return { strength: 0, endurance: 0, power: 0, speed: 1, hypertrophy: 0, accessory: 0 };
    if (type === 'hpr' || type === 'hypertrophy') return { strength: 0, endurance: 0, power: 0, speed: 0, hypertrophy: 1, accessory: 0 };
    if (type === 'acc' || type === 'accessory') return { strength: 0, endurance: 0, power: 0, speed: 0, hypertrophy: 0, accessory: 1 };
    
    // Combined types - each type gets full time
    if (type === 'str/end' || type === 'end/str') return { strength: 1, endurance: 1, power: 0, speed: 0, hypertrophy: 0, accessory: 0 };
    if (type === 'spd/end' || type === 'end/spd') return { strength: 0, endurance: 1, power: 0, speed: 1, hypertrophy: 0, accessory: 0 };
    if (type === 'pwr/end' || type === 'end/pwr') return { strength: 0, endurance: 1, power: 1, speed: 0, hypertrophy: 0, accessory: 0 };
    if (type === 'str/spd' || type === 'spd/str') return { strength: 1, endurance: 0, power: 0, speed: 1, hypertrophy: 0, accessory: 0 };
    if (type === 'str/pwr' || type === 'pwr/str') return { strength: 1, endurance: 0, power: 1, speed: 0, hypertrophy: 0, accessory: 0 };
    if (type === 'pwr/spd' || type === 'spd/pwr') return { strength: 0, endurance: 0, power: 1, speed: 1, hypertrophy: 0, accessory: 0 };
    
    // Non-tracked types (warmup, mobility, stability, activation, neural act, recovery, etc.)
    return null;
  };

  // Helper function to calculate exercise duration in minutes (includes rest)
  const calculateExerciseDurationMinutes = (exercise: any): number => {
    const sets = parseInt(exercise.sets) || 1;
    const reps = parseInt(exercise.reps) || 1;
    const tempo = exercise.tempo || '2.1.2';
    const rest = parseInt(exercise.rest) || 60;

    const tempoPhases = tempo.split('.').map((phase: string) => parseInt(phase) || 2);
    const tempoSeconds = tempoPhases.reduce((sum: number, phase: number) => sum + phase, 0);
    
    // (sets * reps * tempo) + (sets-1) * rest
    const totalSeconds = (sets * reps * tempoSeconds) + ((sets - 1) * rest);
    return totalSeconds / 60; // minutes
  };

  // Helper function to calculate exercise WORK time only (without rest) for training type breakdown
  const calculateExerciseWorkTimeMinutes = (exercise: any): number => {
    const sets = parseInt(exercise.sets) || 1;
    const reps = parseInt(exercise.reps) || 1;
    const tempo = exercise.tempo || '2.1.2';

    const tempoPhases = tempo.split('.').map((phase: string) => parseInt(phase) || 2);
    const tempoSeconds = tempoPhases.reduce((sum: number, phase: number) => sum + phase, 0);
    
    // Only work time: sets * reps * tempo (without rest)
    const totalSeconds = sets * reps * tempoSeconds;
    return totalSeconds / 60; // minutes
  };

  // Helper function to get current day's program based on selectedDate
  const getCurrentDayProgram = useCallback(() => {
    if (!program?.programs?.program_weeks || !selectedDate) return null;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const trainingDates = program.training_dates || [];
    const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
    
    if (dateIndex < 0) return null;
    
    // Calculate which week and day this corresponds to
    const allDays: any[] = [];
    program.programs.program_weeks.forEach((week: any) => {
      week.program_days?.forEach((day: any) => {
        allDays.push(day);
      });
    });
    
    const dayIndex = dateIndex % allDays.length;
    return allDays[dayIndex] || null;
  }, [program, selectedDate]);

  // Helper function to calculate workout stats for the CURRENT DAY ONLY
  const calculateWorkoutStats = useCallback(() => {
    const dayProgram = getCurrentDayProgram();
    
    if (!dayProgram) {
      console.log('⚠️ No day program found for stats calculation');
      return { strength: 0, endurance: 0, power: 0, speed: 0, hypertrophy: 0, accessory: 0, totalVolume: 0, trainingTypeBreakdown: {} };
    }

    const stats = { strength: 0, endurance: 0, power: 0, speed: 0, hypertrophy: 0, accessory: 0, totalVolume: 0 };
    const trainingTypeBreakdown: Record<string, number> = {};

    console.log('📊 Calculating stats for day:', dayProgram.name);
    
    dayProgram.program_blocks?.forEach((block: any) => {
      const trainingType = block.training_type?.toLowerCase().trim() || null;
      const weights = mapTrainingType(trainingType);
      
      console.log(`  Block: ${block.name}, training_type: ${trainingType}, weights:`, weights);
      
      let blockDuration = 0;
      let blockWorkTime = 0; // Work time only (without rest) for training type breakdown
      
      block.program_exercises?.forEach((exercise: any) => {
        const duration = calculateExerciseDurationMinutes(exercise);
        const workTime = calculateExerciseWorkTimeMinutes(exercise);
        blockDuration += duration;
        blockWorkTime += workTime;
        
        // Only add to stats if it's a tracked category
        if (weights) {
          stats.strength += duration * weights.strength;
          stats.endurance += duration * weights.endurance;
          stats.power += duration * weights.power;
          stats.speed += duration * weights.speed;
          stats.hypertrophy += duration * weights.hypertrophy;
          stats.accessory += duration * weights.accessory;
          console.log(`    Exercise duration: ${duration.toFixed(2)} min, work time: ${workTime.toFixed(2)} min`);
        }

        // Calculate volume: sets * reps * kg
        const sets = parseInt(exercise.sets) || 0;
        const reps = parseInt(exercise.reps) || 0;
        const kg = parseFloat(exercise.kg) || 0;
        stats.totalVolume += sets * reps * kg;
      });
      
      // Add ALL training types to breakdown using WORK TIME only (without rest)
      if (trainingType) {
        trainingTypeBreakdown[trainingType] = (trainingTypeBreakdown[trainingType] || 0) + blockWorkTime;
      }
    });

    console.log('📊 Final stats:', stats);
    console.log('📊 Training type breakdown:', trainingTypeBreakdown);
    return { ...stats, trainingTypeBreakdown };
  }, [getCurrentDayProgram]);

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

      // Υπολογισμός και αποθήκευση workout stats
      const workoutStats = calculateWorkoutStats();
      const userId = program.user_id || program.app_users?.id;
      
      if (userId) {
        console.log('📊 Saving workout stats:', workoutStats);
        
        const { error: statsError } = await supabase
          .from('workout_stats')
          .upsert({
            user_id: userId,
            assignment_id: program.id,
            scheduled_date: selectedDateStr,
            total_duration_minutes: actualDurationMinutes,
            total_volume_kg: workoutStats.totalVolume,
            strength_minutes: Math.round(workoutStats.strength),
            endurance_minutes: Math.round(workoutStats.endurance),
            power_minutes: Math.round(workoutStats.power),
            speed_minutes: Math.round(workoutStats.speed),
            hypertrophy_minutes: Math.round(workoutStats.hypertrophy),
            accessory_minutes: Math.round(workoutStats.accessory),
            training_type_breakdown: workoutStats.trainingTypeBreakdown
          }, {
            onConflict: 'user_id,assignment_id,scheduled_date'
          });

        if (statsError) {
          console.error('❌ Error saving workout stats:', statsError);
        } else {
          console.log('✅ Workout stats saved successfully');
        }
      }
      
      // Αφαίρεση από τις ενεργές προπονήσεις
      if (workoutId) {
        removeFromActiveWorkouts(workoutId);
      }
      
      // Clear block timer states
      clearBlockTimerStates();
      
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
  }, [program, selectedDate, currentWorkout, elapsedTime, onRefresh, onClose, removeFromActiveWorkouts, workoutId, calculateWorkoutStats]);

  const handleCancelWorkout = useCallback(() => {
    if (!program || !selectedDate || !workoutId) return;
    
    console.log('❌ Ακύρωση προπόνησης για:', program.app_users?.name);
    setExerciseCompletions({});
    setExerciseData({});
    
    // Αφαίρεση από τις ενεργές προπονήσεις
    removeFromActiveWorkouts(workoutId);
    
    // Clear block timer states
    clearBlockTimerStates();
    
    toast.info(`Προπόνηση ακυρώθηκε για ${program.app_users?.name}`);
  }, [program, selectedDate, workoutId, removeFromActiveWorkouts, clearBlockTimerStates]);

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
      const actualExerciseId = getExerciseId(exerciseId);
      if (!actualExerciseId) return '';
      
      const dayNumber = getDayNumber(exerciseId);
      return sharedNotes.getNotes(actualExerciseId, dayNumber);
    },

    updateNotes: (exerciseId: string, notes: string) => {
      const actualExerciseId = getExerciseId(exerciseId);
      if (!actualExerciseId) return;
      
      const dayNumber = getDayNumber(exerciseId);
      sharedNotes.updateNotes(actualExerciseId, dayNumber, notes);
      console.log(`📝 Updated shared notes for exercise ${actualExerciseId} day ${dayNumber}:`, notes);
    },

    clearNotes: (exerciseId: string) => {
      const actualExerciseId = getExerciseId(exerciseId);
      if (!actualExerciseId) return;
      
      const dayNumber = getDayNumber(exerciseId);
      sharedNotes.clearNotes(actualExerciseId, dayNumber);
      console.log(`🗑️ Cleared shared notes for exercise ${actualExerciseId} day ${dayNumber}`);
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
    },

    getCompletedSets: (exerciseId: string) => {
      return exerciseCompletions[exerciseId] || 0;
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


import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';
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

  // Helper function to get the current day number based on selectedDate
  const getCurrentDayNumber = useCallback(() => {
    if (!program?.training_dates || !selectedDate) return 1;

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateIndex = program.training_dates.findIndex(date => date === selectedDateStr);
    if (dateIndex < 0) return 1;

    const allProgramDays: any[] = [];
    (program.programs?.program_weeks || []).forEach((week: any) => {
      (week.program_days || []).forEach((day: any) => allProgramDays.push(day));
    });

    // Cycle length: προτιμάμε τις ημέρες της 1ης εβδομάδας (template), αλλιώς όλες τις ημέρες
    const cycleLength = program.programs?.program_weeks?.[0]?.program_days?.length || allProgramDays.length || 1;

    return (dateIndex % cycleLength) + 1;
  }, [program, selectedDate]);

  // Helper function to get day number for an exercise (uses current day)
  const getDayNumber = useCallback((exerciseId: string) => {
    return getCurrentDayNumber();
  }, [getCurrentDayNumber]);

  // Helper function to get exercise_id from exercises table (not program_exercise_id)
  const getExerciseId = useCallback((programExerciseId: string) => {
    const weeks = program?.programs?.program_weeks || [];

    for (const week of weeks) {
      for (const day of week.program_days || []) {
        for (const block of day.program_blocks || []) {
          for (const exercise of block.program_exercises || []) {
            if (exercise.id === programExerciseId) {
              return exercise.exercise_id; // reference to exercises table
            }
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

  // Helper function to get day index for current date
  const getCurrentDayIndex = useCallback(() => {
    if (!program?.training_dates || !selectedDate) return -1;
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return program.training_dates.findIndex(date => date === selectedDateStr);
  }, [program, selectedDate]);

  // Φόρτωση δεδομένων από user_exercise_actuals
  useEffect(() => {
    if (program && selectedDate) {
      const loadExerciseData = async () => {
        const newExerciseData: Record<string, any> = {};
        const dayNumber = getCurrentDayNumber();
        const userId = program.user_id || program.app_users?.id;
        
        if (!userId) {
          console.log('⚠️ No userId found for loading actuals');
          setExerciseData({});
          return;
        }
        
        try {
          console.log('🔍 Loading exercise actuals for day:', dayNumber, 'assignment:', program.id);
          
          // Φόρτωσε τα actuals από τον νέο πίνακα user_exercise_actuals
          const { data: actuals, error } = await supabase
            .from('user_exercise_actuals')
            .select('*')
            .eq('assignment_id', program.id)
            .eq('user_id', userId)
            .eq('day_number', dayNumber);
          
          if (error) {
            console.error('❌ Error loading actuals:', error);
          } else if (actuals && actuals.length > 0) {
            console.log('📋 Loaded actuals from database:', actuals);
            
            // Δημιουργία mapping από exercise_id -> actual values
            const exerciseIdToActuals: Record<string, any> = {};
            actuals.forEach((actual: any) => {
              exerciseIdToActuals[actual.exercise_id] = {
                kg: actual.actual_kg || '',
                reps: actual.actual_reps || '',
                velocity: actual.actual_velocity_ms || '',
                notes: actual.notes || ''
              };
            });
            
            // Βρες τα exercises της τρέχουσας ημέρας και κάνε mapping στα program_exercise_id
            const weeks = program.programs?.program_weeks || [];
            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            const dateIndex = program.training_dates?.findIndex(date => date === selectedDateStr) ?? -1;
            
            if (dateIndex >= 0) {
              let cumulativeDays = 0;
              for (const week of weeks) {
                const sortedDays = [...(week.program_days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
                const daysInWeek = sortedDays.length;
                
                if (dateIndex < cumulativeDays + daysInWeek) {
                  const dayIndexInWeek = dateIndex - cumulativeDays;
                  const currentDay = sortedDays[dayIndexInWeek];
                  
                  // Map τα actual values στα program_exercise_id της τρέχουσας ημέρας
                  currentDay?.program_blocks?.forEach(block => {
                    block.program_exercises?.forEach(exercise => {
                      if (exercise.exercise_id && exerciseIdToActuals[exercise.exercise_id]) {
                        newExerciseData[exercise.id] = exerciseIdToActuals[exercise.exercise_id];
                      }
                    });
                  });
                  break;
                }
                cumulativeDays += daysInWeek;
              }
            }
            
            console.log('📋 Loaded exercise data from user_exercise_actuals:', newExerciseData);
          } else {
            console.log('📋 No previous actuals found for this day');
          }
        } catch (error) {
          console.error('❌ Error loading exercise actuals:', error);
        }
        
        setExerciseData(newExerciseData);
      };
      
      loadExerciseData();
    }
  }, [program, selectedDate, getCurrentDayNumber]);

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

  // Helper function to parse time-based reps (e.g., "0:20" = 20 seconds, "1:30" = 90 seconds)
  const parseTimeReps = (reps: string): { isTime: boolean; seconds: number; count: number } => {
    if (!reps) return { isTime: false, seconds: 0, count: 0 };
    
    const repsStr = String(reps).trim();
    
    // Check if it's a time format (contains ":")
    if (repsStr.includes(':')) {
      const parts = repsStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return { isTime: true, seconds: minutes * 60 + seconds, count: 0 };
      }
    }
    
    // Regular number reps
    return { isTime: false, seconds: 0, count: parseInt(repsStr) || 1 };
  };

  // Helper function to parse rest time (e.g., "0:40" = 40 seconds, "1:00" = 60 seconds)
  const parseRestTime = (rest: string): number => {
    if (!rest) return 0;
    
    const restStr = String(rest).trim();
    
    // Check if it's a time format (contains ":")
    if (restStr.includes(':')) {
      const parts = restStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
      }
    }
    
    // Check for "s" suffix (e.g., "60s")
    if (restStr.toLowerCase().endsWith('s')) {
      return parseInt(restStr) || 0;
    }
    
    // Just a number - assume seconds
    return parseInt(restStr) || 0;
  };

  // Helper function to parse workout_duration (e.g., "15:00" = 15 minutes)
  const parseWorkoutDuration = (duration: string): number => {
    if (!duration) return 0;
    
    const durationStr = String(duration).trim();
    
    if (durationStr.includes(':')) {
      const parts = durationStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes + seconds / 60;
      }
    }
    
    return parseFloat(durationStr) || 0;
  };

  // Helper function to calculate exercise duration in minutes
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

  // Helper function to calculate exercise duration using actual values if available
  const calculateExerciseDurationWithActuals = (exercise: any, actualData: any, block: any): number => {
    const sets = parseInt(exercise.sets) || 1;
    const blockSets = parseInt(block?.block_sets) || 1;
    
    // Check for workout_format: non_stop with workout_duration
    const workoutFormat = block?.workout_format?.toLowerCase();
    if (workoutFormat === 'non_stop' || workoutFormat === 'non-stop') {
      const workoutDurationMinutes = parseWorkoutDuration(block?.workout_duration);
      if (workoutDurationMinutes > 0) {
        return workoutDurationMinutes * blockSets;
      }
    }
    
    // Use actual reps if available, otherwise use planned reps
    const repsValue = actualData?.reps || exercise.reps || '1';
    const parsedReps = parseTimeReps(repsValue);
    const restSeconds = parseRestTime(exercise.rest);
    
    let exerciseDurationSeconds: number;
    
    if (parsedReps.isTime) {
      // Time-based exercise: sets * time + (sets-1) * rest
      exerciseDurationSeconds = (sets * parsedReps.seconds) + ((sets - 1) * restSeconds);
    } else {
      // Rep-based exercise: sets * reps * tempo
      const tempo = exercise.tempo || '';
      let tempoSeconds = 3; // default
      
      if (tempo && tempo.includes('.')) {
        const tempoPhases = tempo.split('.').map((phase: string) => parseInt(phase) || 0);
        tempoSeconds = tempoPhases.reduce((sum: number, phase: number) => sum + phase, 0);
      }
      
      if (tempoSeconds === 0) tempoSeconds = 3; // fallback
      
      exerciseDurationSeconds = (sets * parsedReps.count * tempoSeconds) + ((sets - 1) * restSeconds);
    }
    
    // Multiply by block_sets
    return (exerciseDurationSeconds / 60) * blockSets;
  };

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
    console.log('📊 Exercise data (actual values):', exerciseData);
    
    dayProgram.program_blocks?.forEach((block: any) => {
      const trainingType = block.training_type?.toLowerCase().trim() || null;
      const weights = mapTrainingType(trainingType);
      const blockSets = parseInt(block.block_sets) || 1;
      
      console.log(`  Block: ${block.name}, training_type: ${trainingType}, block_sets: ${blockSets}, workout_format: ${block.workout_format}, workout_duration: ${block.workout_duration}, weights:`, weights);
      
      // Check for non_stop format with workout_duration
      const workoutFormat = block.workout_format?.toLowerCase();
      if ((workoutFormat === 'non_stop' || workoutFormat === 'non-stop') && block.workout_duration) {
        const workoutDurationMinutes = parseWorkoutDuration(block.workout_duration);
        const totalBlockDuration = workoutDurationMinutes * blockSets;
        
        console.log(`    Non-stop block duration: ${workoutDurationMinutes} min × ${blockSets} = ${totalBlockDuration} min`);
        
        // Add to stats if it's a tracked category
        if (weights) {
          stats.strength += totalBlockDuration * weights.strength;
          stats.endurance += totalBlockDuration * weights.endurance;
          stats.power += totalBlockDuration * weights.power;
          stats.speed += totalBlockDuration * weights.speed;
          stats.hypertrophy += totalBlockDuration * weights.hypertrophy;
          stats.accessory += totalBlockDuration * weights.accessory;
        }
        
        // Add to training type breakdown
        if (trainingType) {
          trainingTypeBreakdown[trainingType] = (trainingTypeBreakdown[trainingType] || 0) + totalBlockDuration;
        }
        
        // Still calculate volume for exercises in the block
        block.program_exercises?.forEach((exercise: any) => {
          const actualData = exerciseData[exercise.id];
          const sets = parseInt(exercise.sets) || 0;
          const repsValue = actualData?.reps || exercise.reps || '0';
          const parsedReps = parseTimeReps(repsValue);
          const reps = parsedReps.isTime ? 0 : parsedReps.count; // Don't count volume for time-based
          const kg = actualData?.kg ? parseFloat(actualData.kg) : (parseFloat(exercise.kg) || 0);
          const volume = sets * reps * kg * blockSets;
          stats.totalVolume += volume;
        });
        
        return; // Skip per-exercise duration calculation for this block
      }
      
      // Regular block - calculate duration per exercise
      let blockDuration = 0;
      
      block.program_exercises?.forEach((exercise: any) => {
        // Get actual values for this exercise if available
        const actualData = exerciseData[exercise.id];
        
        // Calculate duration using actual reps if available, passing block for block_sets
        const duration = calculateExerciseDurationWithActuals(exercise, actualData, block);
        blockDuration += duration;
        
        // Only add to stats if it's a tracked category
        if (weights) {
          stats.strength += duration * weights.strength;
          stats.endurance += duration * weights.endurance;
          stats.power += duration * weights.power;
          stats.speed += duration * weights.speed;
          stats.hypertrophy += duration * weights.hypertrophy;
          stats.accessory += duration * weights.accessory;
          console.log(`    Exercise ${exercise.id}: duration ${duration.toFixed(2)} min (actual data:`, actualData, ')');
        }

        // Calculate volume: sets * reps * kg - using actual values if available
        const sets = parseInt(exercise.sets) || 0;
        const repsValue = actualData?.reps || exercise.reps || '0';
        const parsedReps = parseTimeReps(repsValue);
        const reps = parsedReps.isTime ? 0 : parsedReps.count; // Don't count volume for time-based
        const kg = actualData?.kg ? parseFloat(actualData.kg) : (parseFloat(exercise.kg) || 0);
        const volume = sets * reps * kg * blockSets;
        stats.totalVolume += volume;
        
        console.log(`    Volume calc: ${sets} sets × ${reps} reps × ${kg} kg × ${blockSets} block_sets = ${volume} kg`);
      });
      
      // Add ALL training types to breakdown (not just tracked ones)
      if (trainingType) {
        trainingTypeBreakdown[trainingType] = (trainingTypeBreakdown[trainingType] || 0) + blockDuration;
      }
    });

    console.log('📊 Final stats:', stats);
    console.log('📊 Training type breakdown:', trainingTypeBreakdown);
    return { ...stats, trainingTypeBreakdown };
  }, [getCurrentDayProgram, exerciseData]);

  const handleCompleteWorkout = useCallback(async (rpeScore?: number) => {
    if (!program || !selectedDate || !currentWorkout) return;

    try {
      console.log('✅ ΟΛΟΚΛΗΡΩΣΗ ΠΡΟΠΟΝΗΣΗΣ για:', program.app_users?.name, 'RPE:', rpeScore);
      
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Υπολογισμός διάρκειας από το χρονόμετρο
      const actualDurationMinutes = Math.round(elapsedTime / 60);
      
      console.log('🔄 Updating workout completion:', {
        assignment_id: program.id,
        scheduled_date: selectedDateStr,
        user_id: program.app_users?.id || program.user_id,
        actual_duration_minutes: actualDurationMinutes,
        rpe_score: rpeScore
      });

      // Χρήση του service για να γίνει upsert αντί για update μόνο
      await updateWorkoutStatus(
        program.id,
        selectedDateStr,
        'completed',
        'green'
      );

      console.log('🔄 Now updating with duration, end time and RPE...');
      
      // Τώρα ενημερώνουμε την εγγραφή με τη διάρκεια, το end_time και το RPE
      const { error } = await supabase
        .from('workout_completions')
        .update({
          actual_duration_minutes: actualDurationMinutes,
          end_time: new Date().toISOString(),
          rpe_score: rpeScore || null
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
      
      // Αποθήκευση exercise actuals στον νέο πίνακα user_exercise_actuals
      try {
        const dayNumber = getCurrentDayNumber();
        const userId = program.user_id || program.app_users?.id;
        
        if (userId && Object.keys(exerciseData).length > 0) {
          console.log('💾 Saving exercise actuals to user_exercise_actuals:', exerciseData);
          
          // Δημιουργία array με τα exercise actuals χρησιμοποιώντας exercise_id
          const actualsToSave: any[] = [];
          
          // Βρες τα exercises της τρέχουσας ημέρας για να πάρουμε τα exercise_id
          const weeks = program.programs?.program_weeks || [];
          const dateIndex = program.training_dates?.findIndex(date => date === selectedDateStr) ?? -1;
          
          if (dateIndex >= 0) {
            let cumulativeDays = 0;
            for (const week of weeks) {
              const sortedDays = [...(week.program_days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
              const daysInWeek = sortedDays.length;
              
              if (dateIndex < cumulativeDays + daysInWeek) {
                const dayIndexInWeek = dateIndex - cumulativeDays;
                const currentDay = sortedDays[dayIndexInWeek];
                
                // Map τα exerciseData (keyed by program_exercise_id) σε exercise_id
                currentDay?.program_blocks?.forEach(block => {
                  block.program_exercises?.forEach(exercise => {
                    const data = exerciseData[exercise.id];
                    if (data && exercise.exercise_id && (data.kg || data.reps || data.velocity)) {
                      actualsToSave.push({
                        user_id: userId,
                        assignment_id: program.id,
                        exercise_id: exercise.exercise_id,
                        day_number: dayNumber,
                        actual_kg: data.kg || null,
                        actual_reps: data.reps || null,
                        actual_velocity_ms: data.velocity || null,
                        notes: data.notes || null
                      });
                    }
                  });
                });
                break;
              }
              cumulativeDays += daysInWeek;
            }
          }
          
          if (actualsToSave.length > 0) {
            // Upsert - διαγραφή παλιών και εισαγωγή νέων
            for (const actual of actualsToSave) {
              await supabase
                .from('user_exercise_actuals')
                .upsert(actual, {
                  onConflict: 'user_id,assignment_id,exercise_id,day_number'
                });
            }
            console.log('✅ Exercise actuals saved:', actualsToSave.length, 'exercises');
          }
        }
      } catch (actualsError) {
        console.error('❌ Error saving exercise actuals:', actualsError);
        // Δεν ρίχνουμε error για να μην αποτύχει η ολοκλήρωση
      }
      
      // Αφαίρεση από τις ενεργές προπονήσεις
      if (workoutId) {
        removeFromActiveWorkouts(workoutId);
      }
      
      // Clear block timer states
      clearBlockTimerStates();
      
      toast.success(`Προπόνηση ολοκληρώθηκε για ${program.app_users?.name}! Διάρκεια: ${actualDurationMinutes} λεπτά`);
      
      // Send RPE notification email if RPE was submitted
      if (rpeScore) {
        try {
          const userId = program.user_id || program.app_users?.id;
          const programName = program.programs?.name || 'Πρόγραμμα';
          
          // Get the day name from the current day
          let dayName = 'Ημέρα';
          const weeks = program.programs?.program_weeks || [];
          const dateIndex = program.training_dates?.findIndex(date => date === selectedDateStr) ?? -1;
          if (dateIndex >= 0) {
            let cumulativeDays = 0;
            for (const week of weeks) {
              const sortedDays = [...(week.program_days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
              const daysInWeek = sortedDays.length;
              if (dateIndex < cumulativeDays + daysInWeek) {
                const dayIndexInWeek = dateIndex - cumulativeDays;
                const currentDay = sortedDays[dayIndexInWeek];
                dayName = currentDay?.name || `Ημέρα ${currentDay?.day_number || dayIndexInWeek + 1}`;
                break;
              }
              cumulativeDays += daysInWeek;
            }
          }
          
          console.log('📧 Sending RPE notification:', { userId, rpeScore, programName, dayName, scheduledDate: selectedDateStr });
          
          supabase.functions.invoke('send-rpe-notification', {
            body: {
              userId,
              rpeScore,
              programName,
              dayName,
              scheduledDate: selectedDateStr
            }
          }).then(({ error }) => {
            if (error) {
              console.error('❌ Error sending RPE notification:', error);
            } else {
              console.log('✅ RPE notification sent');
            }
          });
        } catch (notifyError) {
          console.error('❌ Error preparing RPE notification:', notifyError);
        }
      }
      
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
  }, [program, selectedDate, currentWorkout, elapsedTime, onRefresh, onClose, removeFromActiveWorkouts, workoutId, calculateWorkoutStats, exerciseData]);

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
      // Πρώτα δες αν υπάρχουν notes στο exerciseData (φορτώθηκαν από τη βάση)
      const data = exerciseData[exerciseId];
      if (data?.notes) return data.notes;
      
      // Fallback στα shared notes
      const actualExerciseId = getExerciseId(exerciseId);
      if (!actualExerciseId) return '';
      
      const dayNumber = getDayNumber(exerciseId);
      return sharedNotes.getNotes(actualExerciseId, dayNumber);
    },

    updateNotes: async (exerciseId: string, notes: string) => {
      // Update local state
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], notes }
      }));
      
      // Αποθήκευση στη βάση δεδομένων
      const actualExerciseId = getExerciseId(exerciseId);
      const userId = program?.user_id || program?.app_users?.id;
      const dayNumber = getCurrentDayNumber();
      
      if (actualExerciseId && userId && program) {
        try {
          await supabase.from('user_exercise_actuals').upsert({
            user_id: userId,
            assignment_id: program.id,
            exercise_id: actualExerciseId,
            day_number: dayNumber,
            notes: notes || null
          }, { onConflict: 'user_id,assignment_id,exercise_id,day_number' });
          console.log(`📝 Updated notes for exercise ${actualExerciseId} day ${dayNumber}`);
        } catch (error) {
          console.error('Error saving notes to database:', error);
        }
      }
    },

    clearNotes: async (exerciseId: string) => {
      setExerciseData(prev => {
        const newData = { ...prev };
        if (newData[exerciseId]) {
          delete newData[exerciseId].notes;
        }
        return newData;
      });
      
      // Clear from database
      const actualExerciseId = getExerciseId(exerciseId);
      const userId = program?.user_id || program?.app_users?.id;
      const dayNumber = getCurrentDayNumber();
      
      if (actualExerciseId && userId && program) {
        try {
          await supabase.from('user_exercise_actuals')
            .update({ notes: null })
            .eq('user_id', userId)
            .eq('assignment_id', program.id)
            .eq('exercise_id', actualExerciseId)
            .eq('day_number', dayNumber);
          console.log(`🗑️ Cleared notes for exercise ${actualExerciseId} day ${dayNumber}`);
        } catch (error) {
          console.error('Error clearing notes from database:', error);
        }
      }
    },

    updateKg: async (exerciseId: string, kg: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], kg }
      }));
      
      // Αποθήκευση στη βάση δεδομένων
      const actualExerciseId = getExerciseId(exerciseId);
      const userId = program?.user_id || program?.app_users?.id;
      const dayNumber = getCurrentDayNumber();
      
      if (actualExerciseId && userId && program) {
        try {
          await supabase.from('user_exercise_actuals').upsert({
            user_id: userId,
            assignment_id: program.id,
            exercise_id: actualExerciseId,
            day_number: dayNumber,
            actual_kg: kg || null
          }, { onConflict: 'user_id,assignment_id,exercise_id,day_number' });
        } catch (error) {
          console.error('Error saving kg to database:', error);
        }
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

    updateVelocity: async (exerciseId: string, velocity: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], velocity }
      }));
      
      // Αποθήκευση στη βάση δεδομένων
      const actualExerciseId = getExerciseId(exerciseId);
      const userId = program?.user_id || program?.app_users?.id;
      const dayNumber = getCurrentDayNumber();
      
      if (actualExerciseId && userId && program) {
        try {
          await supabase.from('user_exercise_actuals').upsert({
            user_id: userId,
            assignment_id: program.id,
            exercise_id: actualExerciseId,
            day_number: dayNumber,
            actual_velocity_ms: velocity || null
          }, { onConflict: 'user_id,assignment_id,exercise_id,day_number' });
        } catch (error) {
          console.error('Error saving velocity to database:', error);
        }
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

    updateReps: async (exerciseId: string, reps: string) => {
      setExerciseData(prev => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], reps }
      }));
      
      // Αποθήκευση στη βάση δεδομένων
      const actualExerciseId = getExerciseId(exerciseId);
      const userId = program?.user_id || program?.app_users?.id;
      const dayNumber = getCurrentDayNumber();
      
      if (actualExerciseId && userId && program) {
        try {
          await supabase.from('user_exercise_actuals').upsert({
            user_id: userId,
            assignment_id: program.id,
            exercise_id: actualExerciseId,
            day_number: dayNumber,
            actual_reps: reps || null
          }, { onConflict: 'user_id,assignment_id,exercise_id,day_number' });
        } catch (error) {
          console.error('Error saving reps to database:', error);
        }
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
    },

    // Getters for actual values
    getKg: (exerciseId: string) => {
      return exerciseData[exerciseId]?.kg || '';
    },

    getReps: (exerciseId: string) => {
      return exerciseData[exerciseId]?.reps || '';
    },

    getVelocity: (exerciseId: string) => {
      return exerciseData[exerciseId]?.velocity || '';
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

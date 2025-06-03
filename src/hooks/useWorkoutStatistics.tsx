
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkoutCompletions } from '@/hooks/useWorkoutCompletions';

interface WorkoutStats {
  totalVolume: number;
  totalTimeMinutes: number;
  averageIntensity: number;
  trainingTypeBreakdown: {
    speed: number;
    speedEndurance: number;
    speedStrength: number;
    strengthSpeed: number;
    strengthEndurance: number;
    accelerativeStrength: number;
    maxStrength: number;
    hypertrophy: number;
  };
}

interface ExerciseData {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  kg: string;
  velocity_ms: number;
  tempo: string;
  rest: string;
  block_name: string;
  categories: string[];
  notes?: string;
  adjustedSets?: number;
  adjustedReps?: string;
  adjustedKg?: string;
  adjustedVelocity?: number;
}

export const useWorkoutStatistics = (assignmentId: string) => {
  const [loading, setLoading] = useState(false);
  const [workoutData, setWorkoutData] = useState<ExerciseData[]>([]);
  const [actualWorkoutTimes, setActualWorkoutTimes] = useState<{[key: string]: number}>({});
  const { getWorkoutCompletions } = useWorkoutCompletions();

  const fetchWorkoutData = async () => {
    if (!assignmentId) return;
    
    setLoading(true);
    try {
      // Παίρνουμε όλες τις ολοκληρωμένες προπονήσεις
      const completions = await getWorkoutCompletions(assignmentId);
      const completedDates = completions.map(c => c.scheduled_date);
      
      // Παίρνουμε τους πραγματικούς χρόνους προπόνησης
      const timesData: {[key: string]: number} = {};
      for (const completion of completions) {
        if (completion.start_time && completion.end_time) {
          const start = new Date(completion.start_time);
          const end = new Date(completion.end_time);
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
          timesData[completion.scheduled_date] = durationMinutes;
        } else if (completion.actual_duration_minutes) {
          timesData[completion.scheduled_date] = completion.actual_duration_minutes;
        }
      }
      setActualWorkoutTimes(timesData);

      // Παίρνουμε τα δεδομένα του assignment
      const { data: assignment } = await supabase
        .from('program_assignments')
        .select('id, program_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment?.program_id) return;

      // Παίρνουμε τα δεδομένα του προγράμματος με τις ασκήσεις
      const { data: program } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          program_weeks (
            id,
            week_number,
            program_days (
              id,
              day_number,
              program_blocks (
                id,
                name,
                program_exercises (
                  id,
                  sets,
                  reps,
                  kg,
                  velocity_ms,
                  tempo,
                  rest,
                  notes,
                  exercises (
                    id,
                    name,
                    exercise_to_category (
                      exercise_categories (
                        name,
                        type
                      )
                    )
                  )
                )
              )
            )
          )
        `)
        .eq('id', assignment.program_id)
        .single();

      if (!program) return;

      const exerciseData: ExerciseData[] = [];
      
      program.program_weeks.forEach(week => {
        week.program_days.forEach(day => {
          // Ελέγχουμε αν η ημέρα έχει ολοκληρωθεί
          const weekNumber = week.week_number;
          const dayNumber = day.day_number;
          
          // Υπολογίζουμε την ημερομηνία της ημέρας (απλοποιημένος υπολογισμός)
          const dayCompletion = completions.find(c => 
            c.week_number === weekNumber && c.day_number === dayNumber
          );
          
          if (!dayCompletion) return; // Αν δεν έχει ολοκληρωθεί, την παραλείπουμε

          day.program_blocks.forEach(block => {
            block.program_exercises.forEach(exercise => {
              const categories = exercise.exercises.exercise_to_category.map(
                etc => etc.exercise_categories.name
              );

              exerciseData.push({
                exercise_id: exercise.exercises.id,
                exercise_name: exercise.exercises.name,
                sets: exercise.sets,
                reps: exercise.reps || '0',
                kg: exercise.kg || '0',
                velocity_ms: exercise.velocity_ms || 0,
                tempo: exercise.tempo || '3.0.1.0',
                rest: exercise.rest || '60',
                block_name: block.name.toLowerCase(),
                categories,
                notes: exercise.notes
              });
            });
          });
        });
      });

      setWorkoutData(exerciseData);
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkoutData();
  }, [assignmentId]);

  const statistics = useMemo((): WorkoutStats => {
    if (workoutData.length === 0) {
      return {
        totalVolume: 0,
        totalTimeMinutes: 0,
        averageIntensity: 0,
        trainingTypeBreakdown: {
          speed: 0,
          speedEndurance: 0,
          speedStrength: 0,
          strengthSpeed: 0,
          strengthEndurance: 0,
          accelerativeStrength: 0,
          maxStrength: 0,
          hypertrophy: 0
        }
      };
    }

    let totalVolume = 0;
    const totalTimeMinutes = Object.values(actualWorkoutTimes).reduce((sum, time) => sum + time, 0);
    let totalIntensityPoints = 0;
    let totalExercises = 0;

    const typeMinutes = {
      speed: 0,
      speedEndurance: 0,
      speedStrength: 0,
      strengthSpeed: 0,
      strengthEndurance: 0,
      accelerativeStrength: 0,
      maxStrength: 0,
      hypertrophy: 0
    };

    workoutData.forEach(exercise => {
      // Χρησιμοποιούμε τα πραγματικά δεδομένα αν υπάρχουν σημειώσεις
      const actualSets = exercise.adjustedSets || exercise.sets;
      const actualReps = parseRepsToTotal(exercise.adjustedReps || exercise.reps);
      const actualKg = parseFloat(exercise.adjustedKg || exercise.kg) || 0;
      const actualVelocity = exercise.adjustedVelocity || exercise.velocity_ms;

      // Υπολογισμός όγκου: sets × reps × kg
      const volume = actualSets * actualReps * actualKg;
      totalVolume += volume;

      // Υπολογισμός χρόνου άσκησης
      const tempo = parseTempoToSeconds(exercise.tempo);
      const rest = parseRestToMinutes(exercise.rest);
      const workTime = (actualSets * actualReps * tempo) / 60; // σε λεπτά
      const restTime = (actualSets - 1) * rest;
      const exerciseTime = workTime + restTime;

      // Υπολογισμός έντασης (προσεγγιστικά με βάση kg και velocity)
      const intensity = actualKg > 0 ? actualKg : actualVelocity * 100; // απλοποιημένος υπολογισμός
      totalIntensityPoints += intensity;
      totalExercises++;

      // Κατηγοριοποίηση τύπου προπόνησης
      const trainingType = categorizeTrainingType(
        actualReps,
        actualVelocity,
        intensity,
        exercise.categories,
        exercise.block_name,
        exercise.exercise_name
      );

      typeMinutes[trainingType] += exerciseTime;
    });

    // Υπολογισμός ποσοστών
    const totalTrainingTime = Object.values(typeMinutes).reduce((sum, time) => sum + time, 0);
    const trainingTypeBreakdown = Object.keys(typeMinutes).reduce((acc, key) => ({
      ...acc,
      [key]: totalTrainingTime > 0 ? Math.round((typeMinutes[key as keyof typeof typeMinutes] / totalTrainingTime) * 100) : 0
    }), {} as WorkoutStats['trainingTypeBreakdown']);

    return {
      totalVolume: Math.round(totalVolume),
      totalTimeMinutes: Math.round(totalTimeMinutes),
      averageIntensity: totalExercises > 0 ? Math.round(totalIntensityPoints / totalExercises) : 0,
      trainingTypeBreakdown
    };
  }, [workoutData, actualWorkoutTimes]);

  return {
    statistics,
    loading,
    refetch: fetchWorkoutData
  };
};

// Helper functions
const parseRepsToTotal = (reps: string): number => {
  if (!reps) return 0;
  
  if (!reps.includes('.')) {
    return parseInt(reps) || 0;
  }
  
  const parts = reps.split('.');
  let totalReps = 0;
  
  parts.forEach(part => {
    totalReps += parseInt(part) || 0;
  });
  
  return totalReps;
};

const parseTempoToSeconds = (tempo: string): number => {
  if (!tempo || tempo.trim() === '') {
    return 3;
  }
  
  const parts = tempo.split('.');
  let totalSeconds = 0;
  
  parts.forEach(part => {
    if (part === 'x' || part === 'X') {
      totalSeconds += 0.5;
    } else {
      totalSeconds += parseFloat(part) || 0;
    }
  });
  
  return totalSeconds;
};

const parseRestToMinutes = (rest: string): number => {
  if (!rest) return 0;
  
  if (rest.includes(':')) {
    const [minutes, seconds] = rest.split(':');
    return (parseInt(minutes) || 0) + (parseInt(seconds) || 0) / 60;
  } else if (rest.includes("'")) {
    return parseFloat(rest.replace("'", "")) || 0;
  } else if (rest.includes('s')) {
    return (parseFloat(rest.replace('s', '')) || 0) / 60;
  } else {
    return parseFloat(rest) || 0;
  }
};

const categorizeTrainingType = (
  reps: number,
  velocity: number,
  intensity: number, // προσεγγιστικό % 1RM
  categories: string[],
  blockName: string,
  exerciseName: string
): keyof WorkoutStats['trainingTypeBreakdown'] => {
  const isPlyo = categories.some(cat => cat.toLowerCase().includes('plyometric'));
  const isSprint = categories.some(cat => cat.toLowerCase().includes('sprint')) || 
                   exerciseName.toLowerCase().includes('sprint');
  const isMedball = categories.some(cat => cat.toLowerCase().includes('medball'));
  const isLoadedPlyo = categories.some(cat => cat.toLowerCase().includes('loaded'));
  const isOlyLifting = categories.some(cat => cat.toLowerCase().includes('oly')) ||
                       exerciseName.toLowerCase().includes('clean') ||
                       exerciseName.toLowerCase().includes('snatch');
  const isStrength = categories.some(cat => cat.toLowerCase().includes('strength')) ||
                     exerciseName.toLowerCase().includes('squat') ||
                     exerciseName.toLowerCase().includes('deadlift') ||
                     exerciseName.toLowerCase().includes('bench');

  // Speed
  if ((isPlyo || isSprint) && velocity >= 1.3 && reps <= 6 && intensity < 24) {
    if (blockName.includes('endurance') && (reps >= 15 || intensity > 15)) {
      return 'speedEndurance';
    }
    return 'speed';
  }

  // Speed/Strength
  if ((isMedball || isLoadedPlyo || isOlyLifting) && 
      reps <= 7 && velocity >= 1.0 && velocity <= 1.3 && 
      intensity >= 25 && intensity <= 44) {
    return 'speedStrength';
  }

  // Strength/Speed
  if ((isStrength || isOlyLifting) && 
      reps <= 4 && velocity >= 0.75 && velocity <= 1.0 && 
      intensity >= 45 && intensity <= 65) {
    if (blockName.includes('endurance') && (reps > 10 || intensity > 15)) {
      return 'strengthEndurance';
    }
    return 'strengthSpeed';
  }

  // Accelerative Strength
  if ((isStrength || isOlyLifting) && 
      reps <= 3 && velocity >= 0.5 && velocity <= 0.75 && 
      intensity >= 65 && intensity <= 85) {
    return 'accelerativeStrength';
  }

  // Max Strength
  if (isStrength && reps <= 3 && velocity <= 0.5 && intensity >= 85) {
    return 'maxStrength';
  }

  // Hypertrophy (default για τα υπόλοιπα)
  return 'hypertrophy';
};

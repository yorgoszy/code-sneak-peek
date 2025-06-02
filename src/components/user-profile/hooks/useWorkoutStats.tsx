
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutStats {
  currentMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  previousMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  improvements: {
    workoutsImprovement: number;
    hoursImprovement: number;
    volumeImprovement: number;
  };
}

export const useWorkoutStats = (userId: string) => {
  const [stats, setStats] = useState<WorkoutStats>({
    currentMonth: {
      completedWorkouts: 0,
      totalTrainingHours: 0,
      totalVolume: 0,
      missedWorkouts: 0
    },
    previousMonth: {
      completedWorkouts: 0,
      totalTrainingHours: 0,
      totalVolume: 0,
      missedWorkouts: 0
    },
    improvements: {
      workoutsImprovement: 0,
      hoursImprovement: 0,
      volumeImprovement: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWorkoutStats();
    }
  }, [userId]);

  const calculateDayMetrics = (blocks: any[]) => {
    let totalVolume = 0;
    let totalTimeMinutes = 0;

    blocks.forEach(block => {
      block.program_exercises?.forEach((exercise: any) => {
        if (!exercise.exercise_id) return;

        const sets = exercise.sets || 1;
        const reps = parseRepsToTotal(exercise.reps);
        const kg = parseFloat(exercise.kg) || 0;
        const tempo = parseTempoToSeconds(exercise.tempo);
        const rest = parseRestToMinutes(exercise.rest);

        // Volume: sets × reps × kg
        const volume = sets * reps * kg;
        totalVolume += volume;

        // Time: [(sets × reps) × tempo] + (sets - 1) × rest
        const workTime = (sets * reps * tempo) / 60; // Convert to minutes
        const restTime = (sets - 1) * rest;
        totalTimeMinutes += workTime + restTime;
      });
    });

    return {
      volume: totalVolume,
      timeMinutes: totalTimeMinutes
    };
  };

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

  const fetchWorkoutStats = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch workout completions για τρέχοντα μήνα
      const { data: currentMonthData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', currentMonthStart.toISOString().split('T')[0])
        .lte('completed_date', currentMonthEnd.toISOString().split('T')[0]);

      // Fetch workout completions για προηγούμενο μήνα
      const { data: previousMonthData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', previousMonthStart.toISOString().split('T')[0])
        .lte('completed_date', previousMonthEnd.toISOString().split('T')[0]);

      // Υπολογισμός στατιστικών τρέχοντος μήνα
      const currentCompleted = currentMonthData?.filter(w => w.status === 'completed') || [];
      const currentMissed = currentMonthData?.filter(w => w.status === 'missed').length || 0;

      // Υπολογισμός στατιστικών προηγούμενου μήνα
      const previousCompleted = previousMonthData?.filter(w => w.status === 'completed') || [];
      const previousMissed = previousMonthData?.filter(w => w.status === 'missed').length || 0;

      // Για κάθε ολοκληρωμένη προπόνηση, fetch το πρόγραμμα και υπολόγισε τα πραγματικά metrics
      let currentTotalVolume = 0;
      let currentTotalHours = 0;

      for (const workout of currentCompleted) {
        const { data: programData } = await supabase
          .from('programs')
          .select(`
            program_weeks(
              program_days(
                program_blocks(
                  program_exercises(*)
                )
              )
            )
          `)
          .eq('id', workout.program_id)
          .single();

        if (programData?.program_weeks) {
          const week = programData.program_weeks.find((w: any) => w.week_number === workout.week_number);
          if (week?.program_days) {
            const day = week.program_days.find((d: any) => d.day_number === workout.day_number);
            if (day?.program_blocks) {
              const dayMetrics = calculateDayMetrics(day.program_blocks);
              currentTotalVolume += dayMetrics.volume;
              currentTotalHours += dayMetrics.timeMinutes / 60; // Convert to hours
            }
          }
        }
      }

      let previousTotalVolume = 0;
      let previousTotalHours = 0;

      for (const workout of previousCompleted) {
        const { data: programData } = await supabase
          .from('programs')
          .select(`
            program_weeks(
              program_days(
                program_blocks(
                  program_exercises(*)
                )
              )
            )
          `)
          .eq('id', workout.program_id)
          .single();

        if (programData?.program_weeks) {
          const week = programData.program_weeks.find((w: any) => w.week_number === workout.week_number);
          if (week?.program_days) {
            const day = week.program_days.find((d: any) => d.day_number === workout.day_number);
            if (day?.program_blocks) {
              const dayMetrics = calculateDayMetrics(day.program_blocks);
              previousTotalVolume += dayMetrics.volume;
              previousTotalHours += dayMetrics.timeMinutes / 60; // Convert to hours
            }
          }
        }
      }

      // Υπολογισμός βελτιώσεων
      const workoutsImprovement = currentCompleted.length - previousCompleted.length;
      const hoursImprovement = currentTotalHours - previousTotalHours;
      const volumeImprovement = currentTotalVolume - previousTotalVolume;

      setStats({
        currentMonth: {
          completedWorkouts: currentCompleted.length,
          totalTrainingHours: Math.round(currentTotalHours * 10) / 10,
          totalVolume: Math.round(currentTotalVolume),
          missedWorkouts: currentMissed
        },
        previousMonth: {
          completedWorkouts: previousCompleted.length,
          totalTrainingHours: Math.round(previousTotalHours * 10) / 10,
          totalVolume: Math.round(previousTotalVolume),
          missedWorkouts: previousMissed
        },
        improvements: {
          workoutsImprovement,
          hoursImprovement: Math.round(hoursImprovement * 10) / 10,
          volumeImprovement: Math.round(volumeImprovement)
        }
      });

    } catch (error) {
      console.error('Error fetching workout stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};

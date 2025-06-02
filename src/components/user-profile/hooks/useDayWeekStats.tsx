
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DayWeekStats {
  currentDay: {
    volume: number;
    hours: number;
  };
  currentWeek: {
    volume: number;
    hours: number;
  };
}

export const useDayWeekStats = (userId: string) => {
  const [stats, setStats] = useState<DayWeekStats>({
    currentDay: {
      volume: 0,
      hours: 0
    },
    currentWeek: {
      volume: 0,
      hours: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDayWeekStats();
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

  const fetchDayWeekStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const todayString = today.toISOString().split('T')[0];
      const weekStartString = startOfWeek.toISOString().split('T')[0];

      // Fetch today's completed workouts
      const { data: todayData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed_date', todayString)
        .eq('status', 'completed');

      // Fetch this week's completed workouts
      const { data: weekData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', weekStartString)
        .eq('status', 'completed');

      let dayVolume = 0;
      let dayHours = 0;
      let weekVolume = 0;
      let weekHours = 0;

      // Calculate today's metrics
      for (const workout of todayData || []) {
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
              dayVolume += dayMetrics.volume;
              dayHours += dayMetrics.timeMinutes / 60;
            }
          }
        }
      }

      // Calculate this week's metrics
      for (const workout of weekData || []) {
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
              weekVolume += dayMetrics.volume;
              weekHours += dayMetrics.timeMinutes / 60;
            }
          }
        }
      }

      setStats({
        currentDay: {
          volume: Math.round(dayVolume),
          hours: Math.round(dayHours * 10) / 10
        },
        currentWeek: {
          volume: Math.round(weekVolume),
          hours: Math.round(weekHours * 10) / 10
        }
      });

    } catch (error) {
      console.error('Error fetching day/week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};

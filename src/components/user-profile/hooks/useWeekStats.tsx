
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WeekStats {
  scheduledHours: number;
  actualHours: number;
  completedWorkouts: number;
  totalScheduledWorkouts: number;
}

export const useWeekStats = (userId: string) => {
  const [stats, setStats] = useState<WeekStats>({
    scheduledHours: 0,
    actualHours: 0,
    completedWorkouts: 0,
    totalScheduledWorkouts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWeekStats();
    }
  }, [userId]);

  const fetchWeekStats = async () => {
    try {
      setLoading(true);
      
      // Υπολογισμός ημερομηνιών τρέχουσας εβδομάδας
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Δευτέρα
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Κυριακή
      endOfWeek.setHours(23, 59, 59, 999);

      // Ανάκτηση ολοκληρωμένων προπονήσεων της εβδομάδας
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_date', startOfWeek.toISOString().split('T')[0])
        .lte('completed_date', endOfWeek.toISOString().split('T')[0]);

      // Ανάκτηση προγραμματισμένων προπονήσεων για την εβδομάδα
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select(`
          id,
          program_id,
          training_dates,
          programs(
            program_weeks(
              program_days(
                estimated_duration_minutes,
                day_number,
                program_blocks(
                  program_exercises(*)
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      let totalScheduledHours = 0;
      let totalActualMinutes = 0;
      let totalScheduledWorkouts = 0;

      // Υπολογισμός προγραμματισμένων ωρών
      assignments?.forEach(assignment => {
        assignment.training_dates?.forEach((date: string) => {
          const trainingDate = new Date(date);
          if (trainingDate >= startOfWeek && trainingDate <= endOfWeek) {
            totalScheduledWorkouts++;
            
            // Βρες την αντίστοιχη ημέρα προγράμματος
            const dayOfWeek = trainingDate.getDay();
            const programDay = assignment.programs?.program_weeks?.[0]?.program_days?.find(
              (day: any) => day.day_number === dayOfWeek
            );

            if (programDay?.estimated_duration_minutes) {
              totalScheduledHours += programDay.estimated_duration_minutes / 60;
            } else if (programDay?.program_blocks) {
              // Εκτίμηση διάρκειας βάσει ασκήσεων αν δεν υπάρχει estimated_duration_minutes
              const estimatedMinutes = calculateEstimatedDuration(programDay.program_blocks);
              totalScheduledHours += estimatedMinutes / 60;
            }
          }
        });
      });

      // Υπολογισμός πραγματικών ωρών
      completions?.forEach(completion => {
        if (completion.actual_duration_minutes) {
          totalActualMinutes += completion.actual_duration_minutes;
        }
      });

      setStats({
        scheduledHours: Math.round(totalScheduledHours * 10) / 10,
        actualHours: Math.round((totalActualMinutes / 60) * 10) / 10,
        completedWorkouts: completions?.length || 0,
        totalScheduledWorkouts
      });

    } catch (error) {
      console.error('Error fetching week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedDuration = (blocks: any[]) => {
    let totalMinutes = 0;
    
    blocks.forEach(block => {
      block.program_exercises?.forEach((exercise: any) => {
        const sets = exercise.sets || 1;
        const reps = parseRepsToTotal(exercise.reps);
        const tempo = parseTempoToSeconds(exercise.tempo);
        const rest = parseRestToMinutes(exercise.rest);

        // Χρόνος εργασίας: (sets × reps × tempo) σε λεπτά
        const workTime = (sets * reps * tempo) / 60;
        // Χρόνος ανάπαυσης: (sets - 1) × rest
        const restTime = (sets - 1) * rest;
        
        totalMinutes += workTime + restTime;
      });
    });

    return totalMinutes;
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

  return { stats, loading };
};

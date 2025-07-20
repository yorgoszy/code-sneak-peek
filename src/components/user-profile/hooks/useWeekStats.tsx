
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WeekStats {
  scheduledHours: number;
  actualHours: number;
  scheduledWorkouts: number;
  totalScheduledWorkouts: number;
  missedWorkouts: number;
}

export const useWeekStats = (userId: string) => {
  const [stats, setStats] = useState<WeekStats>({
    scheduledHours: 0,
    actualHours: 0,
    scheduledWorkouts: 0,
    totalScheduledWorkouts: 0,
    missedWorkouts: 0
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

      // Ανάκτηση όλων των workout completions της εβδομάδας
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
        .lte('scheduled_date', endOfWeek.toISOString().split('T')[0]);

      // Ανάκτηση προγραμματισμένων προπονήσεων για την εβδομάδα - διχωρισμός σε ξεχωριστά queries
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select('id, program_id, training_dates')
        .eq('user_id', userId)
        .eq('status', 'active');

      let totalScheduledHours = 0;
      let totalActualMinutes = 0;
      let totalScheduledWorkouts = 0;
      let missedWorkouts = 0;

      if (assignments && assignments.length > 0) {
        // Για κάθε assignment, ανάκτηση των program details
        for (const assignment of assignments) {
          const { data: programData } = await supabase
            .from('programs')
            .select(`
              id,
              program_weeks(
                program_days(
                  estimated_duration_minutes,
                  day_number
                )
              )
            `)
            .eq('id', assignment.program_id)
            .single();

          if (programData && assignment.training_dates) {
            assignment.training_dates.forEach((date: string) => {
              const trainingDate = new Date(date);
              if (trainingDate >= startOfWeek && trainingDate <= endOfWeek) {
                totalScheduledWorkouts++;
                
                // Έλεγχος αν είναι missed workout
                const completion = completions?.find(c => c.scheduled_date === date);
                const isPast = trainingDate < new Date();
                
                if (isPast && (!completion || completion.status !== 'completed')) {
                  missedWorkouts++;
                }
                
                // Βρες την αντίστοιχη ημέρα προγράμματος
                const dayOfWeek = trainingDate.getDay();
                const programDay = programData.program_weeks?.[0]?.program_days?.find(
                  (day: any) => day.day_number === dayOfWeek
                );

                if (programDay?.estimated_duration_minutes) {
                  totalScheduledHours += programDay.estimated_duration_minutes / 60;
                } else {
                  // Εκτίμηση διάρκειας 60 λεπτά αν δεν υπάρχει καθορισμένη διάρκεια
                  totalScheduledHours += 1;
                }
              }
            });
          }
        }
      }

      // Υπολογισμός πραγματικών ωρών από completed workouts
      const completedCompletions = completions?.filter(c => c.status === 'completed') || [];
      completedCompletions.forEach(completion => {
        if (completion.actual_duration_minutes) {
          totalActualMinutes += completion.actual_duration_minutes;
        } else if (completion.start_time && completion.end_time) {
          const start = new Date(completion.start_time);
          const end = new Date(completion.end_time);
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
          totalActualMinutes += durationMinutes;
        }
      });

      setStats({
        scheduledHours: Math.round(totalScheduledHours * 10) / 10,
        actualHours: Math.round((totalActualMinutes / 60) * 10) / 10,
        scheduledWorkouts: totalScheduledWorkouts,
        totalScheduledWorkouts,
        missedWorkouts
      });

    } catch (error) {
      console.error('Error fetching week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};

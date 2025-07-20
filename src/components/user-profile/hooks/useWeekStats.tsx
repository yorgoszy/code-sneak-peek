
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WeekStats {
  scheduledHours: number;
  actualHours: number;
  scheduledWorkouts: number;
  totalScheduledWorkouts: number;
  missedWorkouts: number;
  scheduledMinutes: number;
  actualMinutes: number;
}

export const useWeekStats = (userId: string) => {
  const [stats, setStats] = useState<WeekStats>({
    scheduledHours: 0,
    actualHours: 0,
    scheduledWorkouts: 0,
    totalScheduledWorkouts: 0,
    missedWorkouts: 0,
    scheduledMinutes: 0,
    actualMinutes: 0
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
      
      // Υπολογισμός ημερομηνιών τρέχουσας εβδομάδας (ξεκινάει από Δευτέρα)
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Για Κυριακή πάμε στην προηγούμενη Δευτέρα
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Κυριακή
      endOfWeek.setHours(23, 59, 59, 999);

      // Φέρε τα προγράμματα του χρήστη
      const { data: userPrograms } = await supabase
        .from('program_assignments')
        .select('id, program_id, training_dates')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!userPrograms?.length) {
        setLoading(false);
        return;
      }

      // Φέρε τα workout completions
      const assignmentIds = userPrograms.map(p => p.id);
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .in('assignment_id', assignmentIds);

      // ΑΚΡΙΒΗ ΑΝΤΙΓΡΑΦΗ από UserProfileDailyProgram calculateWeeklyStats
      const calculateWeeklyStats = () => {
        const weekStr = startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Βρες όλες τις προπονήσεις της εβδομάδας από τα training dates
        let allWeeklyWorkouts = 0;
        let completedCount = 0;
        let missedCount = 0;
        let totalScheduledMinutes = 0;
        let totalActualMinutes = 0;
        
        for (const program of userPrograms) {
          if (!program.training_dates) continue;
          
          const weeklyDates = program.training_dates.filter(date => {
            if (!date) return false;
            const trainingDate = new Date(date);
            return trainingDate >= startOfWeek && trainingDate <= endOfWeek;
          });
          
          for (const date of weeklyDates) {
            allWeeklyWorkouts++;
            
            const completion = workoutCompletions?.find(c => 
              c.assignment_id === program.id && c.scheduled_date === date
            );
            
            if (completion?.status === 'completed') {
              completedCount++;
              
              // Υπολογισμός πραγματικών ωρών
              if (completion.actual_duration_minutes) {
                totalActualMinutes += completion.actual_duration_minutes;
              } else if (completion.start_time && completion.end_time) {
                const start = new Date(completion.start_time);
                const end = new Date(completion.end_time);
                const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                totalActualMinutes += durationMinutes;
              }
            } else {
              // Έλεγχος αν έχει περάσει η ημερομηνία
              const workoutDate = new Date(date);
              const today = new Date();
              const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              
              if (isPast || completion?.status === 'missed') {
                missedCount++;
              }
            }
            
            // Υπολογισμός προγραμματισμένων ωρών από τα program data
            // Εκτίμηση 60 λεπτά ανά προπόνηση
            totalScheduledMinutes += 60;
          }
        }

        return { 
          completed: completedCount, 
          missed: missedCount, 
          total: allWeeklyWorkouts,
          scheduledMinutes: totalScheduledMinutes,
          actualMinutes: totalActualMinutes
        };
      };

      const weeklyStats = calculateWeeklyStats();

      setStats({
        scheduledHours: Math.round((weeklyStats.scheduledMinutes / 60) * 10) / 10,
        actualHours: Math.round((weeklyStats.actualMinutes / 60) * 10) / 10,
        scheduledWorkouts: weeklyStats.total,
        totalScheduledWorkouts: weeklyStats.total,
        missedWorkouts: weeklyStats.missed,
        scheduledMinutes: weeklyStats.scheduledMinutes,
        actualMinutes: weeklyStats.actualMinutes
      });

    } catch (error) {
      console.error('Error fetching week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};

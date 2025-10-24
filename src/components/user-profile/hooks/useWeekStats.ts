import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { el } from 'date-fns/locale';
import { calculateScheduledWorkoutMetrics } from './workoutStatsService';

interface WeekStats {
  scheduledMinutes: number;
  actualMinutes: number;
  scheduledWorkouts: number;
  missedWorkouts: number;
}

export const useWeekStats = (userId: string, selectedWeek?: Date) => {
  const [stats, setStats] = useState<WeekStats>({
    scheduledMinutes: 0,
    actualMinutes: 0,
    scheduledWorkouts: 0,
    missedWorkouts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Χρησιμοποιούμε την επιλεγμένη εβδομάδα ή την τρέχουσα
        const weekDate = selectedWeek || new Date();
        const weekStart = startOfWeek(weekDate, { locale: el });
        const weekEnd = endOfWeek(weekDate, { locale: el });

        const startDate = format(weekStart, 'yyyy-MM-dd');
        const endDate = format(weekEnd, 'yyyy-MM-dd');

        const metrics = await calculateScheduledWorkoutMetrics(userId, startDate, endDate);

        setStats({
          scheduledMinutes: Math.round(metrics.totalTrainingHours * 60),
          actualMinutes: 0, // Simplified για τώρα
          scheduledWorkouts: metrics.scheduledWorkouts,
          missedWorkouts: metrics.missedWorkouts
        });
      } catch (error) {
        console.error('Error fetching week stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, selectedWeek]);

  return { stats, loading };
};

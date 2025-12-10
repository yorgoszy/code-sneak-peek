import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

interface WorkoutStatsFromDB {
  totalWorkouts: number;
  completedWorkouts: number;
  missedWorkouts: number;
  totalDurationMinutes: number;
  totalVolume: number;
  averageDurationMinutes: number;
  averageVolumePerWorkout: number;
}

interface UseWorkoutStatsFromDBReturn {
  monthStats: WorkoutStatsFromDB;
  weekStats: WorkoutStatsFromDB;
  allTimeStats: WorkoutStatsFromDB;
  loading: boolean;
  refetch: () => void;
}

const defaultStats: WorkoutStatsFromDB = {
  totalWorkouts: 0,
  completedWorkouts: 0,
  missedWorkouts: 0,
  totalDurationMinutes: 0,
  totalVolume: 0,
  averageDurationMinutes: 0,
  averageVolumePerWorkout: 0
};

export const useWorkoutStatsFromDB = (userId: string | undefined): UseWorkoutStatsFromDBReturn => {
  const [monthStats, setMonthStats] = useState<WorkoutStatsFromDB>(defaultStats);
  const [weekStats, setWeekStats] = useState<WorkoutStatsFromDB>(defaultStats);
  const [allTimeStats, setAllTimeStats] = useState<WorkoutStatsFromDB>(defaultStats);
  const [loading, setLoading] = useState(true);

  const calculateStats = (completions: any[]): WorkoutStatsFromDB => {
    const totalWorkouts = completions.length;
    const completed = completions.filter(c => c.status === 'completed');
    const missed = completions.filter(c => c.status === 'missed');
    
    const totalDurationMinutes = completed.reduce((sum, c) => sum + (c.actual_duration_minutes || 0), 0);
    const totalVolume = completed.reduce((sum, c) => sum + (c.total_volume || 0), 0);
    
    const completedCount = completed.length;
    
    return {
      totalWorkouts,
      completedWorkouts: completedCount,
      missedWorkouts: missed.length,
      totalDurationMinutes,
      totalVolume,
      averageDurationMinutes: completedCount > 0 ? Math.round(totalDurationMinutes / completedCount) : 0,
      averageVolumePerWorkout: completedCount > 0 ? Math.round(totalVolume / completedCount) : 0
    };
  };

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const now = new Date();
      
      // Υπολογισμός date ranges
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // Fetch all completions για τον χρήστη
      const { data: allCompletions, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: false });

      if (error) {
        console.error('Error fetching workout stats:', error);
        setLoading(false);
        return;
      }

      const completions = allCompletions || [];
      
      // Φιλτράρισμα για μήνα
      const monthCompletions = completions.filter(c => 
        c.scheduled_date >= monthStart && c.scheduled_date <= monthEnd
      );
      
      // Φιλτράρισμα για εβδομάδα
      const weekCompletions = completions.filter(c => 
        c.scheduled_date >= weekStart && c.scheduled_date <= weekEnd
      );

      // Υπολογισμός stats
      setMonthStats(calculateStats(monthCompletions));
      setWeekStats(calculateStats(weekCompletions));
      setAllTimeStats(calculateStats(completions));
      
      console.log('📊 Workout stats loaded from DB:', {
        month: calculateStats(monthCompletions),
        week: calculateStats(weekCompletions),
        allTime: calculateStats(completions)
      });
      
    } catch (error) {
      console.error('Error in fetchStats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    monthStats,
    weekStats,
    allTimeStats,
    loading,
    refetch: fetchStats
  };
};

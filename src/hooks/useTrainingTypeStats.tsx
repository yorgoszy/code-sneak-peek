import { useState, useEffect, useMemo, useRef } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { el } from 'date-fns/locale';
import { 
  fetchTrainingTypeStats, 
  aggregateStatsByType, 
  aggregateStatsByWeek, 
  aggregateStatsByMonth,
  calculateStatsFromCompletedWorkouts
} from '@/services/trainingTypeStatsService';

interface UseTrainingTypeStatsProps {
  userId: string;
  timeFilter: 'day' | 'week' | 'month' | 'year';
  currentDate?: Date;
}

interface TrainingTypeData {
  name: string;
  value: number;
}

export const useTrainingTypeStats = ({ userId, timeFilter, currentDate = new Date() }: UseTrainingTypeStatsProps) => {
  const [data, setData] = useState<TrainingTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);

  // Υπολογισμός date range βάσει του timeFilter
  const dateRange = useMemo(() => {
    switch (timeFilter) {
      case 'day':
        return {
          start: format(currentDate, 'yyyy-MM-dd'),
          end: format(currentDate, 'yyyy-MM-dd')
        };
      case 'week':
        return {
          start: format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          start: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          end: format(endOfMonth(currentDate), 'yyyy-MM-dd')
        };
      case 'year':
        return {
          start: format(startOfYear(currentDate), 'yyyy-MM-dd'),
          end: format(endOfYear(currentDate), 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          end: format(endOfMonth(currentDate), 'yyyy-MM-dd')
        };
    }
  }, [timeFilter, currentDate]);

  // Ref για να ξέρουμε αν έχει γίνει ήδη το retroactive calculation
  const retroCalculationDone = useRef(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('📊 Loading training type stats:', { userId, ...dateRange });
        
        // Πρώτα, αν δεν έχει γίνει, κάνουμε retroactive calculation
        if (!retroCalculationDone.current) {
          console.log('📊 Running retroactive calculation...');
          await calculateStatsFromCompletedWorkouts(userId);
          retroCalculationDone.current = true;
        }
        
        const stats = await fetchTrainingTypeStats(userId, dateRange.start, dateRange.end);
        console.log('📊 Fetched stats:', stats);

        // Αθροίζουμε τα stats ανά τύπο
        const aggregated = aggregateStatsByType(stats);
        console.log('📊 Aggregated stats:', aggregated);

        // Μετατρέπουμε σε array για το chart
        const chartData = Object.entries(aggregated).map(([name, value]) => ({
          name,
          value: value as number
        }));

        // Υπολογισμός συνόλου
        const total = chartData.reduce((sum, item) => sum + item.value, 0);

        setData(chartData);
        setTotalMinutes(total);
      } catch (error) {
        console.error('❌ Error loading training type stats:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, dateRange]);

  return {
    data,
    loading,
    totalMinutes,
    dateRange
  };
};

/**
 * Hook για λήψη stats ανά εβδομάδα (για γραφήματα)
 */
export const useWeeklyTrainingTypeStats = (userId: string, startDate: string, endDate: string) => {
  const [weeklyData, setWeeklyData] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) {
        setWeeklyData({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const stats = await fetchTrainingTypeStats(userId, startDate, endDate);
        const weekly = aggregateStatsByWeek(stats);
        setWeeklyData(weekly);
      } catch (error) {
        console.error('❌ Error loading weekly stats:', error);
        setWeeklyData({});
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, startDate, endDate]);

  return { weeklyData, loading };
};

/**
 * Hook για λήψη stats ανά μήνα (για γραφήματα)
 */
export const useMonthlyTrainingTypeStats = (userId: string, startDate: string, endDate: string) => {
  const [monthlyData, setMonthlyData] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) {
        setMonthlyData({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const stats = await fetchTrainingTypeStats(userId, startDate, endDate);
        const monthly = aggregateStatsByMonth(stats);
        setMonthlyData(monthly);
      } catch (error) {
        console.error('❌ Error loading monthly stats:', error);
        setMonthlyData({});
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, startDate, endDate]);

  return { monthlyData, loading };
};

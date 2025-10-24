import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DayStats {
  volume: number;
  hours: number;
}

interface DayWeekStats {
  currentDay: DayStats;
}

export const useDayWeekStats = (userId: string) => {
  const [stats, setStats] = useState<DayWeekStats>({
    currentDay: {
      volume: 0,
      hours: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Simplified για τώρα - θα υλοποιηθεί πλήρως αργότερα
        setStats({
          currentDay: {
            volume: 0,
            hours: 0
          }
        });
      } catch (error) {
        console.error('Error fetching day/week stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};

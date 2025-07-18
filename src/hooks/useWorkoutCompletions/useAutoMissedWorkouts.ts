import { useEffect, useRef } from 'react';
import { workoutStatusService } from './workoutStatusService';

export const useAutoMissedWorkouts = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Εκτέλεσε αμέσως μόλις φορτωθεί η εφαρμογή
    const markMissedWorkouts = async () => {
      try {
        await workoutStatusService.markMissedWorkoutsForPastDates();
        console.log('✅ Auto-marked missed workouts completed');
      } catch (error) {
        console.error('❌ Error in auto-marking missed workouts:', error);
      }
    };

    // Εκτέλεσε αμέσως
    markMissedWorkouts();

    // Εκτέλεσε κάθε 30 λεπτά
    intervalRef.current = setInterval(() => {
      markMissedWorkouts();
    }, 30 * 60 * 1000); // 30 λεπτά

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null;
};
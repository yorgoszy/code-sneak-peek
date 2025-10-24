
export interface WorkoutStats {
  currentMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
    scheduledWorkouts?: number;
  };
  previousMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
    scheduledWorkouts?: number;
  };
  improvements: {
    workoutsImprovement: number;
    hoursImprovement: number;
    volumeImprovement: number;
  };
}

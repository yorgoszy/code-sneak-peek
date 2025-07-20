
export interface WorkoutStats {
  currentMonth: {
    scheduledWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  previousMonth: {
    scheduledWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  improvements: {
    workoutsImprovement: number;
    hoursImprovement: number;
    volumeImprovement: number;
  };
}

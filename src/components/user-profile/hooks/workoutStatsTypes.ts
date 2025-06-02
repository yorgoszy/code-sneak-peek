
export interface WorkoutStats {
  currentMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  previousMonth: {
    completedWorkouts: number;
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

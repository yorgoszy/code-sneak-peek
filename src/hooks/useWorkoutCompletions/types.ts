
export interface WorkoutCompletion {
  id: string;
  assignment_id: string;
  user_id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  scheduled_date: string;
  completed_date: string;
  status: 'completed' | 'missed' | 'makeup' | 'scheduled';
  notes?: string;
  start_time?: string;
  end_time?: string;
  actual_duration_minutes?: number;
  status_color?: string;
  rpe_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseResult {
  id: string;
  workout_completion_id: string;
  program_exercise_id: string;
  actual_sets?: number;
  actual_reps?: string;
  actual_kg?: string;
  actual_velocity_ms?: string;
  actual_rest?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentAttendance {
  id: string;
  assignment_id: string;
  user_id: string;
  total_scheduled_workouts: number;
  completed_workouts: number;
  missed_workouts: number;
  makeup_workouts: number;
  attendance_percentage: number;
  last_updated: string;
}

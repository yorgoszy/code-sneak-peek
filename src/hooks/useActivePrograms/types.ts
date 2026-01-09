
export interface EnrichedAssignment {
  id: string;
  program_id: string;
  athlete_id?: string;
  user_id?: string;
  assigned_by?: string;
  coach_id?: string | null;
  start_date?: string;
  end_date?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  assignment_type?: string;
  group_id?: string;
  progress?: number;
  training_dates?: string[]; // Array of specific dates instead of training_days pattern
  programs?: {
    id: string;
    name: string;
    description?: string;
    training_days?: string[];
    program_weeks: Array<{
      id: string;
      name: string;
      week_number: number;
      program_days: Array<{
        id: string;
        name: string;
        day_number: number;
        estimated_duration_minutes?: number;
        is_test_day?: boolean;
        test_types?: string[];
        is_competition_day?: boolean;
        program_blocks: Array<{
          id: string;
          name: string;
          block_order: number;
          training_type?: string;
          workout_format?: string;
          workout_duration?: string;
          block_sets?: number;
          program_exercises: Array<{
            id: string;
            exercise_id: string;
            sets: number;
            reps: string;
            reps_mode?: string;
            kg?: string;
            kg_mode?: string;
            percentage_1rm?: number;
            velocity_ms?: number;
            tempo?: string;
            rest?: string;
            notes?: string;
            exercise_order: number;
            exercises?: {
              id: string;
              name: string;
              description?: string;
              video_url?: string;
            };
          }>;
        }>;
      }>;
    }>;
  };
  app_users?: {
    id: string;
    name: string;
    email: string;
    photo_url?: string;
    avatar_url?: string;
    coach_id?: string | null;
  } | null;
}

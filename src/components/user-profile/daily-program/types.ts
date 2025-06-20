
export interface TodaysProgramAssignment {
  id: string;
  program_id: string;
  user_id: string;
  assigned_by?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  assignment_type?: string | null;
  group_id?: string | null;
  progress?: number | null;
  training_dates?: string[];
  programs?: {
    id: string;
    name: string;
    description?: string | null;
    program_weeks: Array<{
      id: string;
      name: string;
      week_number: number;
      program_days: Array<{
        id: string;
        name: string;
        day_number: number;
        estimated_duration_minutes?: number | null;
        program_blocks: Array<{
          id: string;
          name: string;
          block_order: number;
          program_exercises: Array<{
            id: string;
            exercise_id: string;
            sets: number;
            reps: string;
            kg?: string | null;
            percentage_1rm?: number | null;
            velocity_ms?: number | null;
            tempo?: string | null;
            rest?: string | null;
            notes?: string | null;
            exercise_order: number;
            exercises?: {
              id: string;
              name: string;
              description?: string | null;
            } | null;
          }>;
        }>;
      }>;
    }>;
  } | null;
  app_users?: {
    id: string;
    name: string;
    email: string;
    photo_url?: string | null;
  } | null;
}

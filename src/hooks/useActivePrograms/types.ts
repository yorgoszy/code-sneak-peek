
export interface EnrichedAssignment {
  id: string;
  program_id: string;
  athlete_id?: string;
  user_id?: string;
  assigned_by?: string;
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
        program_blocks: Array<{
          id: string;
          name: string;
          block_order: number;
        }>;
      }>;
    }>;
  };
  app_users?: {
    id: string;
    name: string;
    email: string;
    photo_url?: string;
  } | null;
}

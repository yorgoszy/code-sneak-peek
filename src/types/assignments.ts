
export interface ProgramAssignment {
  id: string;
  program_id: string;
  assigned_by: string;
  assignment_type: 'individual' | 'group';
  athlete_id?: string;
  group_id?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  programs?: {
    id: string;
    name: string;
    description?: string;
  };
  app_users?: {
    id: string;
    name: string;
    email: string;
  };
  athlete_groups?: {
    id: string;
    name: string;
    athlete_ids: string[];
  };
}

export interface AthleteProgress {
  id: string;
  assignment_id: string;
  athlete_id: string;
  week_number: number;
  day_number: number;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

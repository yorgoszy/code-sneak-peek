
export interface User {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
}

export interface ProgramExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: { name: string };
}

export interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: ProgramExercise[];
}

export interface Day {
  id: string;
  name: string;
  day_number: number;
  program_blocks: Block[];
}

export interface Week {
  id: string;
  name: string;
  week_number: number;
  program_days: Day[];
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  athlete_id?: string;
  app_users?: { 
    name: string;
    photo_url?: string;
  } | null;
  program_weeks: Week[];
}

// Simplified program info for assignments
export interface ProgramInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ProgramAssignment {
  id: string;
  program_id: string;
  athlete_id?: string;
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
  training_dates?: string[];
  programs?: ProgramInfo | null;
  app_users?: User | null;
}

export interface ProgramStructure {
  id?: string;
  name: string;
  description?: string;
  user_id?: string;
  start_date?: Date;
  training_days?: string[];
  training_dates?: string[];
  weeks?: Week[];
  status?: string;
}

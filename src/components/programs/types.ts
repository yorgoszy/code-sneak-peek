export interface User {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  role?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

export interface ProgramExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg?: string;
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
  };
}

export interface Block {
  id: string;
  name: string;
  block_order: number;
  training_type?: 'str' | 'str/spd' | 'pwr' | 'spd/str' | 'spd' | 'str/end' | 'pwr/end' | 'spd/end' | 'end';
  program_exercises: ProgramExercise[];
}

export interface Day {
  id: string;
  name: string;
  day_number: number;
  estimated_duration_minutes?: number;
  program_blocks: Block[];
}

export interface Week {
  id: string;
  name: string;
  week_number: number;
  program_days: Day[];
}

// Program assignment interface
export interface ProgramAssignmentUser {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
}

export interface ProgramAssignment {
  id: string;
  user_id: string;
  training_dates?: string[];
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  app_users?: ProgramAssignmentUser | null;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  athlete_id?: string;
  user_id?: string;
  app_users?: { name: string } | null;
  program_weeks: Week[];
  program_assignments?: ProgramAssignment[];
}

// Simplified program info for assignments
export interface ProgramInfo {
  id: string;
  name: string;
  description?: string;
}

// Program structure interface for the builder - unified version
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

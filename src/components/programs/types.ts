
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
  kg?: string;  // Changed from required to optional
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
  program_exercises: ProgramExercise[];
  // Block-level attributes που ισχύουν για όλες τις ασκήσεις του block
  block_sets?: number;
  block_reps?: string;
  block_time?: string;
  block_rest?: string;
  block_timecup?: string;
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
  // Make app_users optional and flexible to handle join failures
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
  // Make program_assignments optional since not all programs have assignments
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
  training_dates?: string[]; // Added training_dates
  weeks?: Week[];
  status?: string;
}

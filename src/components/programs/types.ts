
export interface User {
  id: string;
  name: string;
  email: string;
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
  app_users?: { name: string };
  program_weeks: Week[];
}

export interface ProgramAssignment {
  id: string;
  program_id: string;
  user_id: string;
  assigned_by?: string;
  assigned_at: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  programs?: Program;
  app_users?: User;
}

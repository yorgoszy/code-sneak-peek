
export interface Exercise {
  id: string;
  name: string;
  usage_count?: number;
}

export interface Attempt {
  attempt_number: number;
  weight_kg: number;
  velocity_ms?: number;
  is_1rm: boolean;
}

export interface ExerciseTest {
  exercise_id: string;
  test_date: string;
  attempts: Attempt[];
}

export interface StrengthSession {
  id?: string;
  user_id: string;
  start_date: string;
  end_date: string;
  notes: string;
  exercise_tests: ExerciseTest[];
}

export interface SessionWithDetails {
  id: string;
  user_id: string;
  test_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  start_date: string;
  end_date: string;
  exercise_tests: any[];
  app_users?: {
    name: string;
  };
}

export interface TestAttempt {
  id: string;
  test_session_id: string;
  exercise_id: string;
  attempt_number: number;
  weight_kg: number;
  velocity_ms?: number;
  is_1rm: boolean;
  exercises?: {
    name: string;
  };
}

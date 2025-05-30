
export interface Exercise {
  id: string;
  name: string;
  usage_count?: number;
}

export interface Attempt {
  id?: string;
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
  is_1rm: boolean;
  exercises?: { name: string };
}

export interface ExerciseTest {
  id?: string;
  exercise_id: string;
  test_date: string;
  attempts: Attempt[];
}

export interface StrengthSession {
  id?: string;
  athlete_id: string;
  start_date: string;
  end_date: string;
  notes: string;
  exercise_tests: ExerciseTest[];
}

export interface SessionWithDetails extends StrengthSession {
  app_users?: { name: string };
  exercise_tests: (ExerciseTest & { 
    exercise_name?: string;
    attempts: (Attempt & { exercises?: { name: string } })[];
  })[];
}

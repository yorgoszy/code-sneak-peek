
export interface TestResult {
  id: string;
  test_date: string;
  test_type: string;
  user_name: string;
  user_id: string;
  notes?: string;
  exercise_count?: number;
  table_name: string;
}

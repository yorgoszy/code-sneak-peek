
DROP POLICY IF EXISTS "Users can create exercise results for their workouts" ON public.exercise_results;
DROP POLICY IF EXISTS "Users can update exercise results for their workouts" ON public.exercise_results;

CREATE POLICY "Users can create exercise results for their workouts"
ON public.exercise_results
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM workout_completions wc
    JOIN app_users au ON au.id = wc.user_id
    WHERE wc.id = exercise_results.workout_completion_id AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update exercise results for their workouts"
ON public.exercise_results
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM workout_completions wc
    JOIN app_users au ON au.id = wc.user_id
    WHERE wc.id = exercise_results.workout_completion_id AND au.auth_user_id = auth.uid()
  )
);

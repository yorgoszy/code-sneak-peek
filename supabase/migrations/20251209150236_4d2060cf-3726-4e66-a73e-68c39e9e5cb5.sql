-- Διαγραφή παλιών policies
DROP POLICY IF EXISTS "System can insert training stats" ON public.training_type_stats;
DROP POLICY IF EXISTS "System can update training stats" ON public.training_type_stats;

-- Νέα policy που επιτρέπει στους χρήστες να εισάγουν τα δικά τους stats
CREATE POLICY "Users can insert their own training stats" 
ON public.training_type_stats 
FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
);

-- Policy για update
CREATE POLICY "Users can update their own training stats" 
ON public.training_type_stats 
FOR UPDATE 
USING (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
);

-- Policy για delete
CREATE POLICY "Users can delete their own training stats" 
ON public.training_type_stats 
FOR DELETE 
USING (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
);
-- Διαγραφή υπαρχουσών policies
DROP POLICY IF EXISTS "Users can insert their own training stats" ON public.training_type_stats;
DROP POLICY IF EXISTS "Users can update their own training stats" ON public.training_type_stats;
DROP POLICY IF EXISTS "Users can delete their own training stats" ON public.training_type_stats;

-- Νέα policy που επιτρέπει σε admins να εισάγουν για όλους
CREATE POLICY "Users and admins can insert training stats" 
ON public.training_type_stats 
FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy για update 
CREATE POLICY "Users and admins can update training stats" 
ON public.training_type_stats 
FOR UPDATE 
USING (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy για delete
CREATE POLICY "Users and admins can delete training stats" 
ON public.training_type_stats 
FOR DELETE 
USING (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);
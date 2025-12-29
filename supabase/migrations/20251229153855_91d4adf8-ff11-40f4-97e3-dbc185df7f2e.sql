-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can insert their own profile" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can update their own profile" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can view their own profile" ON public.coach_profiles;

-- Create new policies that properly match app_users.id with coach_id
CREATE POLICY "Coaches can view their own profile" 
ON public.coach_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.id = coach_profiles.coach_id 
    AND app_users.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can insert their own profile" 
ON public.coach_profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.id = coach_profiles.coach_id 
    AND app_users.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update their own profile" 
ON public.coach_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.id = coach_profiles.coach_id 
    AND app_users.auth_user_id = auth.uid()
  )
);
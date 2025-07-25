-- Phase 1: Critical RLS Policy Fixes

-- 1. Add missing RLS policies for group_assignment_users table
CREATE POLICY "Users can view their own group assignments"
ON public.group_assignment_users
FOR SELECT
USING (user_id IN (
  SELECT id FROM public.app_users 
  WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all group assignments"
ON public.group_assignment_users
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));

-- 2. Fix exercise_results RLS policies to properly reference app_users
DROP POLICY IF EXISTS "Users can manage their own exercise results" ON public.exercise_results;
DROP POLICY IF EXISTS "Users can view their own exercise results" ON public.exercise_results;

CREATE POLICY "Users can view their own exercise results"
ON public.exercise_results
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workout_completions wc
  JOIN public.app_users au ON au.id = wc.user_id
  WHERE wc.id = exercise_results.workout_completion_id
  AND au.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage their own exercise results"
ON public.exercise_results
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.workout_completions wc
  JOIN public.app_users au ON au.id = wc.user_id
  WHERE wc.id = exercise_results.workout_completion_id
  AND au.auth_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_completions wc
  JOIN public.app_users au ON au.id = wc.user_id
  WHERE wc.id = exercise_results.workout_completion_id
  AND au.auth_user_id = auth.uid()
));

-- 3. Create secure role checking function using app_users.role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.app_users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 4. Prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.app_users;

CREATE POLICY "Users can view their own profile"
ON public.app_users
FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile (except role)"
ON public.app_users
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid() AND role = OLD.role);

CREATE POLICY "Admins can manage all users"
ON public.app_users
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');
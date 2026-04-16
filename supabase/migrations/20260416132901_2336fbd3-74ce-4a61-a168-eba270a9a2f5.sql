
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view displayed awards" ON public.user_awards;

-- Users can view their own awards
CREATE POLICY "Users can view own awards"
ON public.user_awards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.id = user_id
      AND au.auth_user_id = auth.uid()
  )
);

-- Coaches/admins can view awards of their managed users
CREATE POLICY "Coaches can view managed user awards"
ON public.user_awards
FOR SELECT
TO authenticated
USING (
  public.is_coach_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.id = user_id
      AND au.coach_id = (
        SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1
      )
  )
);

-- Admins can view all awards
CREATE POLICY "Admins can view all awards"
ON public.user_awards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.role = 'admin'
  )
);

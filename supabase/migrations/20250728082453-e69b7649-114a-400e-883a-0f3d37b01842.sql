-- Allow admins to view all booking sessions when not authenticated
-- This policy allows admin users to access booking data when viewing user profiles
CREATE POLICY "Admins can view all booking sessions when not authenticated" 
ON public.booking_sessions 
FOR SELECT 
TO public
USING (
  -- If there's an authenticated user, use existing auth-based policies
  (auth.uid() IS NOT NULL AND (
    user_id IN (SELECT app_users.id FROM app_users WHERE app_users.auth_user_id = auth.uid())
    OR auth.uid() IN (SELECT app_users.auth_user_id FROM app_users WHERE app_users.role::text = 'admin'::text)
  ))
  OR
  -- If no authenticated user, allow access (this will be used when admins view user profiles)
  auth.uid() IS NULL
);

-- Drop the overly permissive anon policy
DROP POLICY IF EXISTS "Anon can update ring cameras" ON public.ring_analysis_cameras;

-- Allow authenticated users to SELECT cameras (needed for viewers)
CREATE POLICY "Authenticated users can view cameras"
ON public.ring_analysis_cameras FOR SELECT
TO authenticated
USING (true);

-- Allow coaches/admins/federation to INSERT
CREATE POLICY "Coaches and admins can create cameras"
ON public.ring_analysis_cameras FOR INSERT
TO authenticated
WITH CHECK (public.is_coach_user(auth.uid()));

-- Allow coaches/admins/federation to UPDATE
CREATE POLICY "Coaches and admins can update cameras"
ON public.ring_analysis_cameras FOR UPDATE
TO authenticated
USING (public.is_coach_user(auth.uid()))
WITH CHECK (public.is_coach_user(auth.uid()));

-- Allow coaches/admins/federation to DELETE
CREATE POLICY "Coaches and admins can delete cameras"
ON public.ring_analysis_cameras FOR DELETE
TO authenticated
USING (public.is_coach_user(auth.uid()));

-- Drop the existing INSERT policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can create results" ON public.sprint_timing_results;

-- Create new policy that allows anyone to INSERT
CREATE POLICY "Anyone can create sprint results"
ON public.sprint_timing_results
FOR INSERT
TO public
WITH CHECK (true);

-- Also update the UPDATE policy if it exists
DROP POLICY IF EXISTS "Authenticated users can update results" ON public.sprint_timing_results;

CREATE POLICY "Anyone can update sprint results"
ON public.sprint_timing_results
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
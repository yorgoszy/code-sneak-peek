-- Fix: Restrict sprint_timing_results INSERT/UPDATE to authenticated users only
DROP POLICY IF EXISTS "Anyone can create sprint results" ON public.sprint_timing_results;
DROP POLICY IF EXISTS "Anyone can update sprint results" ON public.sprint_timing_results;

CREATE POLICY "Authenticated users can create sprint results"
  ON public.sprint_timing_results FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sprint results"
  ON public.sprint_timing_results FOR UPDATE TO authenticated
  USING (true);
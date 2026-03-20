-- Restrict program tables SELECT from anon to authenticated only
DROP POLICY IF EXISTS "Allow read access to programs" ON public.programs;
DROP POLICY IF EXISTS "Allow read access to program_weeks" ON public.program_weeks;
DROP POLICY IF EXISTS "Allow read access to program_days" ON public.program_days;
DROP POLICY IF EXISTS "Allow read access to program_blocks" ON public.program_blocks;
DROP POLICY IF EXISTS "Allow read access to program_exercises" ON public.program_exercises;

CREATE POLICY "Authenticated can read programs"
  ON public.programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read program_weeks"
  ON public.program_weeks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read program_days"
  ON public.program_days FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read program_blocks"
  ON public.program_blocks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read program_exercises"
  ON public.program_exercises FOR SELECT TO authenticated USING (true);
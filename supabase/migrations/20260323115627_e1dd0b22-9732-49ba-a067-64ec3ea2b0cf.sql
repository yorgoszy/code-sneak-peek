-- ==========================================
-- 1. Fix sprint_timing_sessions RLS
-- ==========================================

-- Drop permissive INSERT/UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.sprint_timing_sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON public.sprint_timing_sessions;

-- INSERT: only set created_by to own auth.uid()
CREATE POLICY "Users can create own sprint sessions"
  ON public.sprint_timing_sessions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.is_coach_user(auth.uid()));

-- UPDATE: only creator or coach/admin
CREATE POLICY "Users can update own sprint sessions"
  ON public.sprint_timing_sessions FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_coach_user(auth.uid()));

-- ==========================================
-- 2. Fix programs read policies (restrict SELECT)
-- ==========================================

-- Helper function to check if user can read a program
CREATE OR REPLACE FUNCTION public.can_read_program(_program_id uuid, _auth_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = _program_id
      AND (
        p.created_by = public.get_app_user_id_for_programs(_auth_uid)
        OR p.coach_id = public.get_app_user_id_for_programs(_auth_uid)
        OR p.is_template = true
        OR p.is_sellable = true
        OR public.is_coach_user(_auth_uid)
        OR EXISTS (
          SELECT 1 FROM public.program_assignments pa
          WHERE pa.program_id = p.id
            AND pa.user_id = public.get_app_user_id_for_programs(_auth_uid)
        )
      )
  );
$$;

-- Programs: replace broad read
DROP POLICY IF EXISTS "Authenticated can read programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can view assigned programs" ON public.programs;

CREATE POLICY "Users can read accessible programs"
  ON public.programs FOR SELECT TO authenticated
  USING (
    created_by = public.get_app_user_id_for_programs(auth.uid())
    OR coach_id = public.get_app_user_id_for_programs(auth.uid())
    OR is_template = true
    OR is_sellable = true
    OR public.is_coach_user(auth.uid())
    OR id IN (
      SELECT pa.program_id FROM public.program_assignments pa
      WHERE pa.user_id = public.get_app_user_id_for_programs(auth.uid())
    )
  );

-- Program weeks: replace broad read
DROP POLICY IF EXISTS "Authenticated can read program_weeks" ON public.program_weeks;

CREATE POLICY "Users can read accessible program_weeks"
  ON public.program_weeks FOR SELECT TO authenticated
  USING (
    public.can_read_program(program_id, auth.uid())
  );

-- Program days: replace broad read
DROP POLICY IF EXISTS "Authenticated can read program_days" ON public.program_days;

CREATE POLICY "Users can read accessible program_days"
  ON public.program_days FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_weeks pw
      WHERE pw.id = program_days.week_id
        AND public.can_read_program(pw.program_id, auth.uid())
    )
  );

-- Program blocks: replace broad read
DROP POLICY IF EXISTS "Authenticated can read program_blocks" ON public.program_blocks;

CREATE POLICY "Users can read accessible program_blocks"
  ON public.program_blocks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_days pd
      JOIN public.program_weeks pw ON pw.id = pd.week_id
      WHERE pd.id = program_blocks.day_id
        AND public.can_read_program(pw.program_id, auth.uid())
    )
  );

-- Program exercises: replace broad read
DROP POLICY IF EXISTS "Authenticated can read program_exercises" ON public.program_exercises;

CREATE POLICY "Users can read accessible program_exercises"
  ON public.program_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_blocks pb
      JOIN public.program_days pd ON pd.id = pb.day_id
      JOIN public.program_weeks pw ON pw.id = pd.week_id
      WHERE pb.id = program_exercises.block_id
        AND public.can_read_program(pw.program_id, auth.uid())
    )
  );
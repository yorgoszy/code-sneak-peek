-- Fix CoachOverview visibility for upcoming tests/competitions by allowing coaches to SELECT the assigned program structure
-- (programs -> program_weeks -> program_days) and assignments for their athletes.

-- program_assignments: coaches can read active assignments for their athletes
ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view assignments for their athletes" ON public.program_assignments;
CREATE POLICY "Coaches can view assignments for their athletes"
ON public.program_assignments
FOR SELECT
USING (
  public.is_admin_safe(auth.uid())
  OR (
    public.is_coach_safe(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.app_users au
      WHERE au.id = public.program_assignments.user_id
        AND au.coach_id = public.get_app_user_id_safe(auth.uid())
    )
  )
);

-- programs: coaches can read programs that are assigned to their athletes
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view programs assigned to their athletes" ON public.programs;
CREATE POLICY "Coaches can view programs assigned to their athletes"
ON public.programs
FOR SELECT
USING (
  public.is_admin_safe(auth.uid())
  OR (
    public.is_coach_safe(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.program_assignments pa
      JOIN public.app_users au ON au.id = pa.user_id
      WHERE pa.program_id = public.programs.id
        AND au.coach_id = public.get_app_user_id_safe(auth.uid())
    )
  )
);

-- program_weeks: readable if parent program readable (via assignment)
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view weeks of assigned programs" ON public.program_weeks;
CREATE POLICY "Coaches can view weeks of assigned programs"
ON public.program_weeks
FOR SELECT
USING (
  public.is_admin_safe(auth.uid())
  OR (
    public.is_coach_safe(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.programs p
      JOIN public.program_assignments pa ON pa.program_id = p.id
      JOIN public.app_users au ON au.id = pa.user_id
      WHERE p.id = public.program_weeks.program_id
        AND au.coach_id = public.get_app_user_id_safe(auth.uid())
    )
  )
);

-- program_days: readable if parent week belongs to a program assigned to coach's athletes
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view days of assigned programs" ON public.program_days;
CREATE POLICY "Coaches can view days of assigned programs"
ON public.program_days
FOR SELECT
USING (
  public.is_admin_safe(auth.uid())
  OR (
    public.is_coach_safe(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.program_weeks pw
      JOIN public.programs p ON p.id = pw.program_id
      JOIN public.program_assignments pa ON pa.program_id = p.id
      JOIN public.app_users au ON au.id = pa.user_id
      WHERE pw.id = public.program_days.week_id
        AND au.coach_id = public.get_app_user_id_safe(auth.uid())
    )
  )
);

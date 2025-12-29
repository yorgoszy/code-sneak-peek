-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting old policies (if exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='program_assignments' AND policyname='Coach can read own coach assignments') THEN
    EXECUTE 'DROP POLICY "Coach can read own coach assignments" ON public.program_assignments';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='program_assignments' AND policyname='Coach can create own coach assignments') THEN
    EXECUTE 'DROP POLICY "Coach can create own coach assignments" ON public.program_assignments';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='program_assignments' AND policyname='Coach can update own coach assignments') THEN
    EXECUTE 'DROP POLICY "Coach can update own coach assignments" ON public.program_assignments';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='program_assignments' AND policyname='Coach can delete own coach assignments') THEN
    EXECUTE 'DROP POLICY "Coach can delete own coach assignments" ON public.program_assignments';
  END IF;
END$$;

-- Helper predicate: current authenticated app_user id
-- We already have public.get_app_user_id_safe(auth.uid())

-- SELECT: coach can read assignments they created (coach_id matches their app_users.id)
CREATE POLICY "Coach can read own coach assignments"
ON public.program_assignments
FOR SELECT
USING (
  coach_id IS NOT NULL
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

-- INSERT: coach can create assignments for coach_users, only for themselves
CREATE POLICY "Coach can create own coach assignments"
ON public.program_assignments
FOR INSERT
WITH CHECK (
  coach_id IS NOT NULL
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

-- UPDATE: coach can update their assignments
CREATE POLICY "Coach can update own coach assignments"
ON public.program_assignments
FOR UPDATE
USING (
  coach_id IS NOT NULL
  AND coach_id = public.get_app_user_id_safe(auth.uid())
)
WITH CHECK (
  coach_id IS NOT NULL
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

-- DELETE: coach can delete their assignments
CREATE POLICY "Coach can delete own coach assignments"
ON public.program_assignments
FOR DELETE
USING (
  coach_id IS NOT NULL
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

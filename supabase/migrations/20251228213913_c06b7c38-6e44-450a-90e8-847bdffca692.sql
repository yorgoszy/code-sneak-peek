-- Ensure RLS is enabled
ALTER TABLE public.coach_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coach_users' AND policyname='Coach users: select own or admin') THEN
    DROP POLICY "Coach users: select own or admin" ON public.coach_users;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coach_users' AND policyname='Coach users: insert own or admin') THEN
    DROP POLICY "Coach users: insert own or admin" ON public.coach_users;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coach_users' AND policyname='Coach users: update own or admin') THEN
    DROP POLICY "Coach users: update own or admin" ON public.coach_users;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coach_users' AND policyname='Coach users: delete own or admin') THEN
    DROP POLICY "Coach users: delete own or admin" ON public.coach_users;
  END IF;
END $$;

-- SELECT: coaches see their own athletes; admins see all
CREATE POLICY "Coach users: select own or admin"
ON public.coach_users
FOR SELECT
USING (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

-- INSERT: coaches can create athletes for themselves; admins can create for any coach
CREATE POLICY "Coach users: insert own or admin"
ON public.coach_users
FOR INSERT
WITH CHECK (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

-- UPDATE: coaches can edit athletes that belong to them; admins can edit all
CREATE POLICY "Coach users: update own or admin"
ON public.coach_users
FOR UPDATE
USING (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
)
WITH CHECK (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

-- DELETE: coaches can delete athletes that belong to them; admins can delete all
CREATE POLICY "Coach users: delete own or admin"
ON public.coach_users
FOR DELETE
USING (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

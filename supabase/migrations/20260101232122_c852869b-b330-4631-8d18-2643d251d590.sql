-- Allow coaches (and admins) to read coach_receipts for their athletes
-- This fixes empty receipts in UserProfilePayments where data exists but is blocked by RLS.

ALTER TABLE public.coach_receipts ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting old policies (safe if they don't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coach_receipts'
      AND policyname = 'Coach can read own coach receipts'
  ) THEN
    DROP POLICY "Coach can read own coach receipts" ON public.coach_receipts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coach_receipts'
      AND policyname = 'Admin can read all coach receipts'
  ) THEN
    DROP POLICY "Admin can read all coach receipts" ON public.coach_receipts;
  END IF;
END $$;

-- Coaches can read receipts where they are the issuing coach.
-- Mapping auth.uid() -> app_users.id via app_users.auth_user_id.
CREATE POLICY "Coach can read own coach receipts"
ON public.coach_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.id = coach_receipts.coach_id
  )
);

-- Admins can read all coach receipts.
CREATE POLICY "Admin can read all coach receipts"
ON public.coach_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.role = 'admin'
  )
);

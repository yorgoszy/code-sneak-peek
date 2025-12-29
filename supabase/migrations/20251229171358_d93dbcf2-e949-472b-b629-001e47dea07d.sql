-- Add coach_user_id to program_assignments for coach-specific athletes (stored in coach_users)
ALTER TABLE public.program_assignments
ADD COLUMN IF NOT EXISTS coach_user_id uuid;

-- Foreign key to coach_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'program_assignments_coach_user_id_fkey'
  ) THEN
    ALTER TABLE public.program_assignments
    ADD CONSTRAINT program_assignments_coach_user_id_fkey
    FOREIGN KEY (coach_user_id)
    REFERENCES public.coach_users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful index for coach queries
CREATE INDEX IF NOT EXISTS idx_program_assignments_coach_user_id
ON public.program_assignments(coach_user_id);

-- Add exercise_id to coach endurance data to support MAS/Sprint per exercise
ALTER TABLE public.coach_endurance_test_data
ADD COLUMN IF NOT EXISTS exercise_id uuid NULL;

DO $$ BEGIN
  ALTER TABLE public.coach_endurance_test_data
  ADD CONSTRAINT coach_endurance_test_data_exercise_id_fkey
  FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
  ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_coach_endurance_test_data_exercise_id
ON public.coach_endurance_test_data (exercise_id);
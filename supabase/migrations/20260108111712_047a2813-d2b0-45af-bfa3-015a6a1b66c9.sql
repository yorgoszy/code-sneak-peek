-- Make user_id nullable in fms_exercise_mappings (global data, not user-specific)
ALTER TABLE public.fms_exercise_mappings ALTER COLUMN user_id DROP NOT NULL;
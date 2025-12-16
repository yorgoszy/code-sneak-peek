-- Προσθήκη στήλης rpe_score στο workout_completions
ALTER TABLE public.workout_completions 
ADD COLUMN IF NOT EXISTS rpe_score integer CHECK (rpe_score >= 1 AND rpe_score <= 10);
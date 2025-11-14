-- Προσθήκη πεδίων reps_mode στον πίνακα program_exercises
-- Αυτό επιτρέπει την αποθήκευση του τύπου (reps, time, meter)
ALTER TABLE public.program_exercises
ADD COLUMN IF NOT EXISTS reps_mode TEXT DEFAULT 'reps' CHECK (reps_mode IN ('reps', 'time', 'meter'));

-- Ενημέρωση υπαρχόντων records να έχουν το default value
UPDATE public.program_exercises
SET reps_mode = 'reps'
WHERE reps_mode IS NULL;

-- Ενημέρωση default για kg_mode
ALTER TABLE public.program_exercises
ALTER COLUMN kg_mode SET DEFAULT 'kg';

-- Προσθήκη check constraint για kg_mode
ALTER TABLE public.program_exercises
ADD CONSTRAINT check_kg_mode CHECK (kg_mode IS NULL OR kg_mode IN ('kg', 'rpm', 'meter', 's/m', 'km/h'));

-- Ενημέρωση υπαρχόντων records να έχουν το default value
UPDATE public.program_exercises
SET kg_mode = 'kg'
WHERE kg_mode IS NULL;
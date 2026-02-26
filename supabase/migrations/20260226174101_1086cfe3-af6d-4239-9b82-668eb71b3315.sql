ALTER TABLE public.workout_completions 
DROP CONSTRAINT workout_completions_status_check;

ALTER TABLE public.workout_completions 
ADD CONSTRAINT workout_completions_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'missed'::text, 'makeup'::text, 'cancelled'::text, 'in_progress'::text, 'scheduled'::text]));
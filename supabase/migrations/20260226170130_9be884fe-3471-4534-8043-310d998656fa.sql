ALTER TABLE public.workout_completions 
ADD CONSTRAINT uq_workout_completions_assignment_date 
UNIQUE (assignment_id, scheduled_date);
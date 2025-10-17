-- Add exercise_id to endurance_test_data
ALTER TABLE public.endurance_test_data
ADD COLUMN exercise_id uuid REFERENCES public.exercises(id);

-- Add index for better performance
CREATE INDEX idx_endurance_test_data_exercise_id ON public.endurance_test_data(exercise_id);
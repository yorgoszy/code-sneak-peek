-- Create table for workout training type statistics
CREATE TABLE IF NOT EXISTS public.workout_training_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_completion_id UUID NOT NULL REFERENCES public.workout_completions(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL,
  duration_minutes NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_training_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout training types"
ON public.workout_training_types
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workout_completions wc
    JOIN public.app_users au ON au.id = wc.user_id
    WHERE wc.id = workout_training_types.workout_completion_id
    AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own workout training types"
ON public.workout_training_types
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_completions wc
    JOIN public.app_users au ON au.id = wc.user_id
    WHERE wc.id = workout_training_types.workout_completion_id
    AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own workout training types"
ON public.workout_training_types
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workout_completions wc
    JOIN public.app_users au ON au.id = wc.user_id
    WHERE wc.id = workout_training_types.workout_completion_id
    AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own workout training types"
ON public.workout_training_types
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workout_completions wc
    JOIN public.app_users au ON au.id = wc.user_id
    WHERE wc.id = workout_training_types.workout_completion_id
    AND au.auth_user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_workout_training_types_completion_id ON public.workout_training_types(workout_completion_id);

-- Create trigger for updated_at
CREATE TRIGGER update_workout_training_types_updated_at
BEFORE UPDATE ON public.workout_training_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
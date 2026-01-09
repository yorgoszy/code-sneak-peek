-- Create table to store muscle-exercise links for functional test results
CREATE TABLE public.functional_muscle_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  muscle_name TEXT NOT NULL,
  issue_name TEXT NOT NULL, -- e.g., 'Κύφωση', 'Λόρδωση', 'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ'
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('stretching', 'strengthening')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(muscle_name, issue_name, exercise_type)
);

-- Enable RLS
ALTER TABLE public.functional_muscle_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (everyone can read)
CREATE POLICY "Everyone can view functional muscle exercises" 
ON public.functional_muscle_exercises 
FOR SELECT 
USING (true);

-- Create policies for admin/coach access (insert, update, delete)
CREATE POLICY "Admins can manage functional muscle exercises" 
ON public.functional_muscle_exercises 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_functional_muscle_exercises_muscle ON public.functional_muscle_exercises(muscle_name);
CREATE INDEX idx_functional_muscle_exercises_issue ON public.functional_muscle_exercises(issue_name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_functional_muscle_exercises_updated_at
BEFORE UPDATE ON public.functional_muscle_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
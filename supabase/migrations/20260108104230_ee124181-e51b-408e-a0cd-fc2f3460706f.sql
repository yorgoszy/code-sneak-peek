-- Πίνακας για αποθήκευση ασκήσεων FMS με status χρώματος
CREATE TABLE public.fms_exercise_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  fms_exercise TEXT NOT NULL, -- π.χ. "Shoulder Mobility", "Deep Squat"
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('red', 'yellow', 'green')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, fms_exercise, exercise_id)
);

-- Enable RLS
ALTER TABLE public.fms_exercise_mappings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all fms_exercise_mappings" 
ON public.fms_exercise_mappings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert fms_exercise_mappings" 
ON public.fms_exercise_mappings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update fms_exercise_mappings" 
ON public.fms_exercise_mappings 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete fms_exercise_mappings" 
ON public.fms_exercise_mappings 
FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_fms_exercise_mappings_updated_at
BEFORE UPDATE ON public.fms_exercise_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
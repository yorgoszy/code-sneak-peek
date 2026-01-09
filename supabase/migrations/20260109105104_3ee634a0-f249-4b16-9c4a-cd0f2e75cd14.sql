-- Πίνακας για σύνδεση κόκκινων ασκήσεων με προτεινόμενες εναλλακτικές
CREATE TABLE public.fms_exercise_alternatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fms_exercise TEXT NOT NULL, -- π.χ. "Shoulder Mobility"
  red_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alternative_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fms_exercise, red_exercise_id, alternative_exercise_id)
);

-- Enable RLS
ALTER TABLE public.fms_exercise_alternatives ENABLE ROW LEVEL SECURITY;

-- Policies για πρόσβαση
CREATE POLICY "Everyone can view FMS exercise alternatives"
ON public.fms_exercise_alternatives FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert FMS exercise alternatives"
ON public.fms_exercise_alternatives FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update FMS exercise alternatives"
ON public.fms_exercise_alternatives FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete FMS exercise alternatives"
ON public.fms_exercise_alternatives FOR DELETE
USING (true);

-- Trigger για updated_at
CREATE TRIGGER update_fms_exercise_alternatives_updated_at
BEFORE UPDATE ON public.fms_exercise_alternatives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Πίνακας για αποθήκευση actual values ανά χρήστη/άσκηση/ημέρα προγράμματος
-- Αυτά τα δεδομένα θα μεταφέρονται αυτόματα στην επόμενη εβδομάδα
CREATE TABLE public.user_exercise_actuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  actual_kg TEXT,
  actual_reps TEXT,
  actual_velocity_ms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, assignment_id, exercise_id, day_number)
);

-- Enable RLS
ALTER TABLE public.user_exercise_actuals ENABLE ROW LEVEL SECURITY;

-- Users can view their own actuals
CREATE POLICY "Users can view their own exercise actuals"
ON public.user_exercise_actuals
FOR SELECT
USING (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()));

-- Users can create their own actuals
CREATE POLICY "Users can create their own exercise actuals"
ON public.user_exercise_actuals
FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()));

-- Users can update their own actuals
CREATE POLICY "Users can update their own exercise actuals"
ON public.user_exercise_actuals
FOR UPDATE
USING (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()));

-- Users can delete their own actuals
CREATE POLICY "Users can delete their own exercise actuals"
ON public.user_exercise_actuals
FOR DELETE
USING (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()));

-- Admins can manage all
CREATE POLICY "Admins can manage all exercise actuals"
ON public.user_exercise_actuals
FOR ALL
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_user_exercise_actuals_updated_at
BEFORE UPDATE ON public.user_exercise_actuals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_user_exercise_actuals_lookup 
ON public.user_exercise_actuals(user_id, assignment_id, exercise_id, day_number);
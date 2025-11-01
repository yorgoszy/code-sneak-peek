-- Πίνακας για 1RM καταγραφές ανά χρήστη και άσκηση
CREATE TABLE IF NOT EXISTS public.user_exercise_1rm (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.app_users(id)
);

-- Indexes για ταχύτητα
CREATE INDEX idx_user_exercise_1rm_user ON public.user_exercise_1rm(user_id);
CREATE INDEX idx_user_exercise_1rm_exercise ON public.user_exercise_1rm(exercise_id);
CREATE INDEX idx_user_exercise_1rm_date ON public.user_exercise_1rm(recorded_date DESC);

-- Enable RLS
ALTER TABLE public.user_exercise_1rm ENABLE ROW LEVEL SECURITY;

-- Πολιτικές: Admins μπορούν τα πάντα
CREATE POLICY "Admins can manage all 1RM records"
ON public.user_exercise_1rm
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Χρήστες μπορούν να δουν τα δικά τους 1RM
CREATE POLICY "Users can view their own 1RM records"
ON public.user_exercise_1rm
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM app_users
    WHERE auth_user_id = auth.uid()
  )
);

-- Trigger για updated_at
CREATE TRIGGER update_user_exercise_1rm_updated_at
BEFORE UPDATE ON public.user_exercise_1rm
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
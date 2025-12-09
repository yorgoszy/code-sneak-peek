-- Πίνακας για μόνιμη αποθήκευση στατιστικών τύπων προπόνησης
CREATE TABLE public.training_type_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.program_assignments(id) ON DELETE SET NULL,
  workout_completion_id UUID REFERENCES public.workout_completions(id) ON DELETE SET NULL,
  training_date DATE NOT NULL,
  training_type TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index για γρήγορη αναζήτηση ανά χρήστη και ημερομηνία
CREATE INDEX idx_training_type_stats_user_date ON public.training_type_stats(user_id, training_date);
CREATE INDEX idx_training_type_stats_user_type ON public.training_type_stats(user_id, training_type);

-- Enable RLS
ALTER TABLE public.training_type_stats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own training stats"
ON public.training_type_stats
FOR SELECT
USING (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage all training stats"
ON public.training_type_stats
FOR ALL
USING (EXISTS (
  SELECT 1 FROM app_users
  WHERE app_users.auth_user_id = auth.uid()
  AND app_users.role = 'admin'
));

CREATE POLICY "System can insert training stats"
ON public.training_type_stats
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update training stats"
ON public.training_type_stats
FOR UPDATE
USING (true);

-- Trigger για auto-update updated_at
CREATE TRIGGER update_training_type_stats_updated_at
BEFORE UPDATE ON public.training_type_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
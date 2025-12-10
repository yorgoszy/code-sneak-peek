-- Δημιουργία πίνακα workout_stats για αποθήκευση στατιστικών ανά ολοκληρωμένη προπόνηση
CREATE TABLE public.workout_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  
  -- Βασικά στατιστικά
  total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  total_volume_kg NUMERIC NOT NULL DEFAULT 0,
  
  -- Αναλυτικά λεπτά ανά τύπο προπόνησης
  strength_minutes INTEGER NOT NULL DEFAULT 0,
  endurance_minutes INTEGER NOT NULL DEFAULT 0,
  power_minutes INTEGER NOT NULL DEFAULT 0,
  speed_minutes INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint για να αποφύγουμε διπλές εγγραφές
  UNIQUE(user_id, assignment_id, scheduled_date)
);

-- Enable RLS
ALTER TABLE public.workout_stats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own workout stats"
ON public.workout_stats
FOR SELECT
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can insert their own workout stats"
ON public.workout_stats
FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own workout stats"
ON public.workout_stats
FOR UPDATE
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all workout stats"
ON public.workout_stats
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.app_users
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

-- Trigger για auto-update του updated_at
CREATE TRIGGER update_workout_stats_updated_at
BEFORE UPDATE ON public.workout_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index για γρήγορες αναζητήσεις
CREATE INDEX idx_workout_stats_user_id ON public.workout_stats(user_id);
CREATE INDEX idx_workout_stats_assignment_id ON public.workout_stats(assignment_id);
CREATE INDEX idx_workout_stats_scheduled_date ON public.workout_stats(scheduled_date);
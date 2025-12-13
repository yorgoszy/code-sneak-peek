-- Πίνακας μυών
CREATE TABLE public.muscles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.muscles ENABLE ROW LEVEL SECURITY;

-- Policies για muscles
CREATE POLICY "Everyone can view muscles" 
ON public.muscles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage muscles" 
ON public.muscles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));

-- Πίνακας συνδέσεων προβλημάτων με μύες
CREATE TABLE public.functional_issue_muscle_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_category TEXT NOT NULL, -- 'posture', 'squat', 'single_leg_squat'
  issue_name TEXT NOT NULL, -- π.χ. 'Κύφωση', 'Valgus ΑΡΙΣΤΕΡΑ'
  muscle_id UUID NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('strengthen', 'stretch')),
  dysfunction TEXT, -- περιγραφή δυσλειτουργίας
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_category, issue_name, muscle_id, action_type)
);

-- Enable RLS
ALTER TABLE public.functional_issue_muscle_mappings ENABLE ROW LEVEL SECURITY;

-- Policies για mappings
CREATE POLICY "Everyone can view mappings" 
ON public.functional_issue_muscle_mappings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage mappings" 
ON public.functional_issue_muscle_mappings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));

-- Trigger για updated_at
CREATE TRIGGER update_muscles_updated_at
BEFORE UPDATE ON public.muscles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mappings_updated_at
BEFORE UPDATE ON public.functional_issue_muscle_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
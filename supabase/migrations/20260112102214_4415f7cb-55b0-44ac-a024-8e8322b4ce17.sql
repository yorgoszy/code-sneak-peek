-- User Goals table
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'workout_count', 'weight_loss', 'strength_gain', 'attendance', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC, -- π.χ. 10 προπονήσεις, 5 κιλά, κτλ
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- 'workouts', 'kg', '%', κτλ
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'cancelled'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Awards table (βραβεία που κέρδισε ο χρήστης)
CREATE TABLE public.user_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.user_goals(id) ON DELETE SET NULL,
  award_type TEXT NOT NULL, -- 'goal_completed', 'streak', 'milestone', 'special'
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Award', -- lucide icon name
  color TEXT DEFAULT '#cb8954', -- χρυσό
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_displayed BOOLEAN DEFAULT true, -- αν εμφανίζεται στο προφίλ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_awards ENABLE ROW LEVEL SECURITY;

-- Policies for user_goals
CREATE POLICY "Users can view their own goals" 
ON public.user_goals FOR SELECT 
USING (auth.uid() IN (SELECT auth_user_id FROM public.app_users WHERE id = user_id));

CREATE POLICY "Users can create their own goals" 
ON public.user_goals FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.app_users WHERE id = user_id));

CREATE POLICY "Users can update their own goals" 
ON public.user_goals FOR UPDATE 
USING (auth.uid() IN (SELECT auth_user_id FROM public.app_users WHERE id = user_id));

CREATE POLICY "Users can delete their own goals" 
ON public.user_goals FOR DELETE 
USING (auth.uid() IN (SELECT auth_user_id FROM public.app_users WHERE id = user_id));

-- Admin/Trainer can view all
CREATE POLICY "Admin can view all goals" 
ON public.user_goals FOR SELECT 
USING (auth.uid() IN (SELECT auth_user_id FROM public.app_users WHERE role IN ('admin', 'trainer')));

-- Policies for user_awards
CREATE POLICY "Users can view their own awards" 
ON public.user_awards FOR SELECT 
USING (auth.uid() IN (SELECT auth_user_id FROM public.app_users WHERE id = user_id));

CREATE POLICY "Anyone can view displayed awards" 
ON public.user_awards FOR SELECT 
USING (is_displayed = true);

CREATE POLICY "System can create awards" 
ON public.user_awards FOR INSERT 
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_status ON public.user_goals(status);
CREATE INDEX idx_user_awards_user_id ON public.user_awards(user_id);

-- Update trigger
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
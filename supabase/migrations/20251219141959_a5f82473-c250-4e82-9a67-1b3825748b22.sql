-- Training phase configuration table
CREATE TABLE public.training_phase_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_key text NOT NULL UNIQUE, -- e.g., 'maximal-strength', 'power', 'starting-strength'
  phase_name text NOT NULL,
  phase_type text NOT NULL DEFAULT 'main', -- 'main' or 'sub'
  parent_phase_key text, -- for sub-phases
  rep_range_min integer,
  rep_range_max integer,
  intensity_range_min integer, -- percentage
  intensity_range_max integer,
  rest_range_min integer, -- seconds
  rest_range_max integer,
  tempo_recommendation text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phase exercise categories - which categories to use for each phase
CREATE TABLE public.phase_exercise_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.training_phase_config(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.exercise_categories(id) ON DELETE CASCADE,
  priority integer DEFAULT 1, -- 1 = primary, 2 = secondary, etc
  created_at timestamptz DEFAULT now(),
  UNIQUE(phase_id, category_id)
);

-- Phase recommended exercises - specific exercises per phase
CREATE TABLE public.phase_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.training_phase_config(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  priority integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(phase_id, exercise_id)
);

-- Phase rep schemes - specific set/rep schemes per phase
CREATE TABLE public.phase_rep_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.training_phase_config(id) ON DELETE CASCADE,
  scheme_name text NOT NULL, -- e.g., '5x5', '3x8'
  sets integer NOT NULL,
  reps text NOT NULL, -- can be '5' or '8-12'
  tempo text,
  rest text, -- e.g., '3min', '90sec'
  intensity_percent integer, -- %1RM
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Corrective exercises for functional issues
CREATE TABLE public.corrective_issue_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_name text NOT NULL, -- e.g., 'knee_valgus', 'hip_shift'
  issue_category text NOT NULL, -- e.g., 'squat', 'posture', 'single_leg'
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  exercise_type text NOT NULL DEFAULT 'corrective', -- 'corrective', 'activation', 'mobility', 'strengthening'
  priority integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(issue_name, exercise_id)
);

-- Corrective exercises for muscle imbalances
CREATE TABLE public.corrective_muscle_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muscle_id uuid NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'stretch' or 'strengthen'
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  priority integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(muscle_id, action_type, exercise_id)
);

-- User annual planning data (to store what admin sets for each user/year)
CREATE TABLE public.user_annual_planning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  monthly_phases jsonb DEFAULT '{}', -- {1: ['maximal-strength'], 2: ['power'], ...}
  weekly_phases jsonb DEFAULT '{}', -- detailed weekly breakdown
  notes text,
  created_by uuid REFERENCES public.app_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE public.training_phase_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_rep_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_issue_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_muscle_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_annual_planning ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can read phase config
CREATE POLICY "Everyone can read training phase config" ON public.training_phase_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage training phase config" ON public.training_phase_config FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can read phase exercise categories" ON public.phase_exercise_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage phase exercise categories" ON public.phase_exercise_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can read phase exercises" ON public.phase_exercises FOR SELECT USING (true);
CREATE POLICY "Admins can manage phase exercises" ON public.phase_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can read phase rep schemes" ON public.phase_rep_schemes FOR SELECT USING (true);
CREATE POLICY "Admins can manage phase rep schemes" ON public.phase_rep_schemes FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can read corrective issue exercises" ON public.corrective_issue_exercises FOR SELECT USING (true);
CREATE POLICY "Admins can manage corrective issue exercises" ON public.corrective_issue_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can read corrective muscle exercises" ON public.corrective_muscle_exercises FOR SELECT USING (true);
CREATE POLICY "Admins can manage corrective muscle exercises" ON public.corrective_muscle_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own annual planning" ON public.user_annual_planning FOR SELECT USING (
  user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all annual planning" ON public.user_annual_planning FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Insert default phase configurations
INSERT INTO public.training_phase_config (phase_key, phase_name, phase_type, parent_phase_key, rep_range_min, rep_range_max, intensity_range_min, intensity_range_max, rest_range_min, rest_range_max, description) VALUES
-- Main phases
('hypertrophy', 'Υπερτροφία', 'main', NULL, 8, 12, 65, 75, 60, 90, 'Φάση μυϊκής ανάπτυξης'),
('maximal-strength', 'Μέγιστη Δύναμη', 'main', NULL, 1, 6, 85, 100, 180, 300, 'Φάση μέγιστης δύναμης'),
('power', 'Ισχύς', 'main', NULL, 1, 5, 30, 60, 120, 180, 'Φάση ισχύος - εκρηκτικότητας'),
('endurance', 'Αντοχή', 'main', NULL, 12, 20, 40, 60, 30, 60, 'Φάση μυϊκής αντοχής'),
('corrective', 'Διόρθωση', 'main', NULL, 10, 15, 40, 60, 45, 60, 'Διορθωτικές ασκήσεις'),
('competition', 'Αγώνας', 'main', NULL, 1, 3, 90, 100, 180, 300, 'Περίοδος αγώνων'),

-- Sub-phases for Maximal Strength
('starting-strength', 'Starting Strength', 'sub', 'maximal-strength', 3, 5, 75, 85, 180, 240, 'Αρχική φάση δύναμης'),
('explosive-strength', 'Explosive Strength', 'sub', 'maximal-strength', 2, 4, 80, 90, 180, 240, 'Εκρηκτική δύναμη'),
('reactive-strength', 'Reactive Strength', 'sub', 'maximal-strength', 3, 6, 85, 95, 180, 300, 'Αντιδραστική δύναμη'),

-- Sub-phases for Power
('str-spd', 'STR/SPD', 'sub', 'power', 3, 5, 70, 85, 120, 180, 'Δύναμη-Ταχύτητα'),
('pwr', 'PWR', 'sub', 'power', 1, 3, 30, 50, 120, 180, 'Καθαρή ισχύς'),
('spd-str', 'SPD/STR', 'sub', 'power', 2, 4, 50, 70, 90, 150, 'Ταχύτητα-Δύναμη'),
('spd', 'SPD', 'sub', 'power', 1, 3, 20, 40, 90, 120, 'Ταχύτητα'),

-- Sub-phases for Endurance
('str-end', 'STR/END', 'sub', 'endurance', 10, 15, 50, 65, 45, 60, 'Δύναμη-Αντοχή'),
('pwr-end', 'PWR/END', 'sub', 'endurance', 8, 12, 40, 55, 30, 45, 'Ισχύς-Αντοχή'),
('spd-end', 'SPD/END', 'sub', 'endurance', 12, 20, 30, 50, 20, 30, 'Ταχύτητα-Αντοχή'),
('end', 'END', 'sub', 'endurance', 15, 25, 30, 50, 15, 30, 'Καθαρή αντοχή'),
('aero-end', 'AERO/END', 'sub', 'endurance', 20, 30, 20, 40, 10, 20, 'Αερόβια αντοχή');

-- Insert default rep schemes for main phases
INSERT INTO public.phase_rep_schemes (phase_id, scheme_name, sets, reps, tempo, rest, intensity_percent, is_primary, notes) 
SELECT id, '5x5', 5, '5', '3.1.1', '3min', 80, true, 'Κλασικό scheme δύναμης'
FROM public.training_phase_config WHERE phase_key = 'maximal-strength';

INSERT INTO public.phase_rep_schemes (phase_id, scheme_name, sets, reps, tempo, rest, intensity_percent, is_primary, notes) 
SELECT id, '6x3', 6, '3', '2.0.X', '3min', 85, false, 'Υψηλή ένταση'
FROM public.training_phase_config WHERE phase_key = 'maximal-strength';

INSERT INTO public.phase_rep_schemes (phase_id, scheme_name, sets, reps, tempo, rest, intensity_percent, is_primary, notes) 
SELECT id, '4x8', 4, '8', '3.1.1', '90sec', 70, true, 'Βασικό scheme υπερτροφίας'
FROM public.training_phase_config WHERE phase_key = 'hypertrophy';

INSERT INTO public.phase_rep_schemes (phase_id, scheme_name, sets, reps, tempo, rest, intensity_percent, is_primary, notes) 
SELECT id, '3x12', 3, '12', '2.1.1', '60sec', 65, false, 'Υψηλός όγκος'
FROM public.training_phase_config WHERE phase_key = 'hypertrophy';

INSERT INTO public.phase_rep_schemes (phase_id, scheme_name, sets, reps, tempo, rest, intensity_percent, is_primary, notes) 
SELECT id, '5x3', 5, '3', 'X.X.X', '2min', 40, true, 'Εκρηκτικές επαναλήψεις'
FROM public.training_phase_config WHERE phase_key = 'power';

INSERT INTO public.phase_rep_schemes (phase_id, scheme_name, sets, reps, tempo, rest, intensity_percent, is_primary, notes) 
SELECT id, '3x15', 3, '15', '2.0.1', '45sec', 50, true, 'Μυϊκή αντοχή'
FROM public.training_phase_config WHERE phase_key = 'endurance';

-- Trigger for updated_at
CREATE TRIGGER update_training_phase_config_updated_at
  BEFORE UPDATE ON public.training_phase_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_annual_planning_updated_at
  BEFORE UPDATE ON public.user_annual_planning
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
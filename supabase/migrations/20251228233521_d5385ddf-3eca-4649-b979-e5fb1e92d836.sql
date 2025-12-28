
-- ============================================
-- COACH PROGRESS TRACKING TABLES
-- Ξεχωριστοί πίνακες για κάθε coach
-- ============================================

-- 1. FORCE/VELOCITY (Strength) Tests
CREATE TABLE public.coach_strength_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coach_strength_test_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID NOT NULL REFERENCES public.coach_strength_test_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  weight_kg NUMERIC,
  velocity_ms NUMERIC,
  is_1rm BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ENDURANCE Tests
CREATE TABLE public.coach_endurance_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coach_endurance_test_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID NOT NULL REFERENCES public.coach_endurance_test_sessions(id) ON DELETE CASCADE,
  mas_kmh NUMERIC,
  mas_meters NUMERIC,
  mas_minutes NUMERIC,
  mas_ms NUMERIC,
  vo2_max NUMERIC,
  max_hr INTEGER,
  resting_hr_1min INTEGER,
  push_ups INTEGER,
  pull_ups INTEGER,
  crunches INTEGER,
  t2b INTEGER,
  farmer_kg NUMERIC,
  farmer_meters NUMERIC,
  farmer_seconds NUMERIC,
  sprint_meters NUMERIC,
  sprint_seconds NUMERIC,
  sprint_watt NUMERIC,
  sprint_resistance TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. JUMP PROFILE Tests
CREATE TABLE public.coach_jump_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coach_jump_test_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID NOT NULL REFERENCES public.coach_jump_test_sessions(id) ON DELETE CASCADE,
  counter_movement_jump NUMERIC,
  non_counter_movement_jump NUMERIC,
  depth_jump NUMERIC,
  broad_jump NUMERIC,
  triple_jump_left NUMERIC,
  triple_jump_right NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ANTHROPOMETRIC (Σωματομετρικά) Tests
CREATE TABLE public.coach_anthropometric_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coach_anthropometric_test_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID NOT NULL REFERENCES public.coach_anthropometric_test_sessions(id) ON DELETE CASCADE,
  height NUMERIC,
  weight NUMERIC,
  body_fat_percentage NUMERIC,
  muscle_mass_percentage NUMERIC,
  visceral_fat_percentage NUMERIC,
  bone_density NUMERIC,
  chest_circumference NUMERIC,
  waist_circumference NUMERIC,
  hip_circumference NUMERIC,
  arm_circumference NUMERIC,
  thigh_circumference NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FUNCTIONAL (Λειτουργικά) Tests
CREATE TABLE public.coach_functional_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coach_functional_test_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID NOT NULL REFERENCES public.coach_functional_test_sessions(id) ON DELETE CASCADE,
  fms_score INTEGER,
  fms_detailed_scores JSONB,
  sit_and_reach NUMERIC,
  flamingo_balance NUMERIC,
  shoulder_mobility_left NUMERIC,
  shoulder_mobility_right NUMERIC,
  posture_assessment TEXT,
  posture_issues TEXT[],
  squat_issues TEXT[],
  single_leg_squat_issues TEXT[],
  muscles_need_stretching TEXT[],
  muscles_need_strengthening TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES - Κάθε coach βλέπει μόνο τα δικά του
-- ============================================

-- Strength Sessions
ALTER TABLE public.coach_strength_test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_strength_sessions_select" ON public.coach_strength_test_sessions FOR SELECT USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_strength_sessions_insert" ON public.coach_strength_test_sessions FOR INSERT WITH CHECK (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_strength_sessions_update" ON public.coach_strength_test_sessions FOR UPDATE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_strength_sessions_delete" ON public.coach_strength_test_sessions FOR DELETE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));

-- Strength Data
ALTER TABLE public.coach_strength_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_strength_data_all" ON public.coach_strength_test_data FOR ALL USING (
  EXISTS (SELECT 1 FROM public.coach_strength_test_sessions s WHERE s.id = test_session_id AND (s.coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid())))
);

-- Endurance Sessions
ALTER TABLE public.coach_endurance_test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_endurance_sessions_select" ON public.coach_endurance_test_sessions FOR SELECT USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_endurance_sessions_insert" ON public.coach_endurance_test_sessions FOR INSERT WITH CHECK (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_endurance_sessions_update" ON public.coach_endurance_test_sessions FOR UPDATE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_endurance_sessions_delete" ON public.coach_endurance_test_sessions FOR DELETE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));

-- Endurance Data
ALTER TABLE public.coach_endurance_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_endurance_data_all" ON public.coach_endurance_test_data FOR ALL USING (
  EXISTS (SELECT 1 FROM public.coach_endurance_test_sessions s WHERE s.id = test_session_id AND (s.coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid())))
);

-- Jump Sessions
ALTER TABLE public.coach_jump_test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_jump_sessions_select" ON public.coach_jump_test_sessions FOR SELECT USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_jump_sessions_insert" ON public.coach_jump_test_sessions FOR INSERT WITH CHECK (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_jump_sessions_update" ON public.coach_jump_test_sessions FOR UPDATE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_jump_sessions_delete" ON public.coach_jump_test_sessions FOR DELETE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));

-- Jump Data
ALTER TABLE public.coach_jump_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_jump_data_all" ON public.coach_jump_test_data FOR ALL USING (
  EXISTS (SELECT 1 FROM public.coach_jump_test_sessions s WHERE s.id = test_session_id AND (s.coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid())))
);

-- Anthropometric Sessions
ALTER TABLE public.coach_anthropometric_test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_anthropometric_sessions_select" ON public.coach_anthropometric_test_sessions FOR SELECT USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_anthropometric_sessions_insert" ON public.coach_anthropometric_test_sessions FOR INSERT WITH CHECK (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_anthropometric_sessions_update" ON public.coach_anthropometric_test_sessions FOR UPDATE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_anthropometric_sessions_delete" ON public.coach_anthropometric_test_sessions FOR DELETE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));

-- Anthropometric Data
ALTER TABLE public.coach_anthropometric_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_anthropometric_data_all" ON public.coach_anthropometric_test_data FOR ALL USING (
  EXISTS (SELECT 1 FROM public.coach_anthropometric_test_sessions s WHERE s.id = test_session_id AND (s.coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid())))
);

-- Functional Sessions
ALTER TABLE public.coach_functional_test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_functional_sessions_select" ON public.coach_functional_test_sessions FOR SELECT USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_functional_sessions_insert" ON public.coach_functional_test_sessions FOR INSERT WITH CHECK (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_functional_sessions_update" ON public.coach_functional_test_sessions FOR UPDATE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));
CREATE POLICY "coach_functional_sessions_delete" ON public.coach_functional_test_sessions FOR DELETE USING (coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid()));

-- Functional Data
ALTER TABLE public.coach_functional_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_functional_data_all" ON public.coach_functional_test_data FOR ALL USING (
  EXISTS (SELECT 1 FROM public.coach_functional_test_sessions s WHERE s.id = test_session_id AND (s.coach_id = get_app_user_id_safe(auth.uid()) OR is_admin_safe(auth.uid())))
);

-- Indexes για performance
CREATE INDEX idx_coach_strength_sessions_coach ON public.coach_strength_test_sessions(coach_id);
CREATE INDEX idx_coach_strength_sessions_user ON public.coach_strength_test_sessions(coach_user_id);
CREATE INDEX idx_coach_endurance_sessions_coach ON public.coach_endurance_test_sessions(coach_id);
CREATE INDEX idx_coach_endurance_sessions_user ON public.coach_endurance_test_sessions(coach_user_id);
CREATE INDEX idx_coach_jump_sessions_coach ON public.coach_jump_test_sessions(coach_id);
CREATE INDEX idx_coach_jump_sessions_user ON public.coach_jump_test_sessions(coach_user_id);
CREATE INDEX idx_coach_anthropometric_sessions_coach ON public.coach_anthropometric_test_sessions(coach_id);
CREATE INDEX idx_coach_anthropometric_sessions_user ON public.coach_anthropometric_test_sessions(coach_user_id);
CREATE INDEX idx_coach_functional_sessions_coach ON public.coach_functional_test_sessions(coach_id);
CREATE INDEX idx_coach_functional_sessions_user ON public.coach_functional_test_sessions(coach_user_id);

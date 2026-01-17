-- ============================================
-- MUAY THAI STATISTICS SYSTEM - PHASE 1
-- ============================================

-- Πίνακας Αγώνων (Fights)
CREATE TABLE public.muaythai_fights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  opponent_name TEXT NOT NULL,
  fight_date DATE NOT NULL,
  result TEXT CHECK (result IN ('win', 'loss', 'draw', 'no_contest')),
  fight_type TEXT NOT NULL CHECK (fight_type IN ('training', 'sparring', 'competition')),
  total_rounds INTEGER NOT NULL DEFAULT 3,
  round_duration_seconds INTEGER NOT NULL DEFAULT 180,
  location TEXT,
  weight_class TEXT,
  notes TEXT,
  video_url TEXT,
  video_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Πίνακας Γύρων (Rounds)
CREATE TABLE public.muaythai_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.muaythai_fights(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  duration_seconds INTEGER DEFAULT 180,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fight_id, round_number)
);

-- Πίνακας Χτυπημάτων (Strike Events)
CREATE TABLE public.muaythai_strikes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.muaythai_rounds(id) ON DELETE CASCADE,
  timestamp_in_round INTEGER, -- seconds from round start
  strike_type TEXT NOT NULL CHECK (strike_type IN ('punch', 'kick', 'knee', 'elbow')),
  side TEXT NOT NULL CHECK (side IN ('left', 'right')),
  landed BOOLEAN NOT NULL DEFAULT false,
  target_area TEXT CHECK (target_area IN ('head', 'body', 'legs')),
  power_level INTEGER CHECK (power_level BETWEEN 1 AND 5),
  is_counter BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Πίνακας Αμύνων (Defense Events)
CREATE TABLE public.muaythai_defenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.muaythai_rounds(id) ON DELETE CASCADE,
  timestamp_in_round INTEGER, -- seconds from round start
  defense_type TEXT NOT NULL CHECK (defense_type IN ('block', 'dodge', 'parry', 'clinch', 'check')),
  successful BOOLEAN NOT NULL DEFAULT true,
  incoming_strike_type TEXT CHECK (incoming_strike_type IN ('punch', 'kick', 'knee', 'elbow')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Πίνακας Video Action Markers (για 30-sec interval analysis)
CREATE TABLE public.muaythai_video_markers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.muaythai_fights(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  action_start_seconds NUMERIC(10,2) NOT NULL, -- exact start time
  action_end_seconds NUMERIC(10,2) NOT NULL, -- exact end time
  action_type TEXT NOT NULL CHECK (action_type IN ('attack', 'defense')),
  interval_label TEXT, -- e.g., "0:30-1:00"
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Πίνακας Υπολογισμένων Στατιστικών (Calculated Stats - cached)
CREATE TABLE public.muaythai_calculated_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fight_id UUID NOT NULL REFERENCES public.muaythai_fights(id) ON DELETE CASCADE,
  round_number INTEGER, -- NULL for total fight stats
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(10,4),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Πίνακας Fighter Profiles (Clustering)
CREATE TABLE public.muaythai_fighter_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE UNIQUE,
  cluster_name TEXT,
  cluster_characteristics JSONB,
  fight_style TEXT CHECK (fight_style IN ('aggressive', 'defensive', 'balanced', 'counter_fighter', 'technical')),
  dominant_strike TEXT,
  dominant_side TEXT CHECK (dominant_side IN ('left', 'right', 'balanced')),
  avg_strikes_per_round NUMERIC(10,2),
  strike_accuracy NUMERIC(5,2),
  defense_success_rate NUMERIC(5,2),
  last_calculated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_muaythai_fights_user_id ON public.muaythai_fights(user_id);
CREATE INDEX idx_muaythai_fights_coach_id ON public.muaythai_fights(coach_id);
CREATE INDEX idx_muaythai_fights_date ON public.muaythai_fights(fight_date);
CREATE INDEX idx_muaythai_rounds_fight_id ON public.muaythai_rounds(fight_id);
CREATE INDEX idx_muaythai_strikes_round_id ON public.muaythai_strikes(round_id);
CREATE INDEX idx_muaythai_defenses_round_id ON public.muaythai_defenses(round_id);
CREATE INDEX idx_muaythai_video_markers_fight_id ON public.muaythai_video_markers(fight_id);
CREATE INDEX idx_muaythai_calculated_stats_fight_id ON public.muaythai_calculated_stats(fight_id);

-- Enable RLS
ALTER TABLE public.muaythai_fights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muaythai_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muaythai_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muaythai_defenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muaythai_video_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muaythai_calculated_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muaythai_fighter_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for muaythai_fights
CREATE POLICY "Users can view their own fights" ON public.muaythai_fights
  FOR SELECT USING (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.id = user_id OR au.id = coach_id OR au.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "Coaches can insert fights for their users" ON public.muaythai_fights
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "Coaches can update fights" ON public.muaythai_fights
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.id = coach_id OR au.role = 'admin'
    )
  );

CREATE POLICY "Coaches can delete fights" ON public.muaythai_fights
  FOR DELETE USING (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.id = coach_id OR au.role = 'admin'
    )
  );

-- RLS Policies for muaythai_rounds (inherit from fights)
CREATE POLICY "Users can view rounds of their fights" ON public.muaythai_rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM muaythai_fights f 
      WHERE f.id = fight_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.user_id OR au.id = f.coach_id OR au.role IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "Coaches can manage rounds" ON public.muaythai_rounds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM muaythai_fights f 
      WHERE f.id = fight_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.coach_id OR au.role = 'admin'
      )
    )
  );

-- RLS Policies for muaythai_strikes (inherit from rounds)
CREATE POLICY "Users can view strikes" ON public.muaythai_strikes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM muaythai_rounds r
      JOIN muaythai_fights f ON f.id = r.fight_id
      WHERE r.id = round_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.user_id OR au.id = f.coach_id OR au.role IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "Coaches can manage strikes" ON public.muaythai_strikes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM muaythai_rounds r
      JOIN muaythai_fights f ON f.id = r.fight_id
      WHERE r.id = round_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.coach_id OR au.role = 'admin'
      )
    )
  );

-- RLS Policies for muaythai_defenses
CREATE POLICY "Users can view defenses" ON public.muaythai_defenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM muaythai_rounds r
      JOIN muaythai_fights f ON f.id = r.fight_id
      WHERE r.id = round_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.user_id OR au.id = f.coach_id OR au.role IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "Coaches can manage defenses" ON public.muaythai_defenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM muaythai_rounds r
      JOIN muaythai_fights f ON f.id = r.fight_id
      WHERE r.id = round_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.coach_id OR au.role = 'admin'
      )
    )
  );

-- RLS Policies for muaythai_video_markers
CREATE POLICY "Users can view video markers" ON public.muaythai_video_markers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM muaythai_fights f 
      WHERE f.id = fight_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.user_id OR au.id = f.coach_id OR au.role IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "Coaches can manage video markers" ON public.muaythai_video_markers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM muaythai_fights f 
      WHERE f.id = fight_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.coach_id OR au.role = 'admin'
      )
    )
  );

-- RLS Policies for muaythai_calculated_stats
CREATE POLICY "Users can view calculated stats" ON public.muaythai_calculated_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM muaythai_fights f 
      WHERE f.id = fight_id 
      AND auth.uid() IN (
        SELECT au.auth_user_id FROM app_users au 
        WHERE au.id = f.user_id OR au.id = f.coach_id OR au.role IN ('admin', 'coach')
      )
    )
  );

CREATE POLICY "System can manage calculated stats" ON public.muaythai_calculated_stats
  FOR ALL USING (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.role IN ('admin', 'coach')
    )
  );

-- RLS Policies for muaythai_fighter_profiles
CREATE POLICY "Users can view their own profile" ON public.muaythai_fighter_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.id = user_id OR au.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "System can manage fighter profiles" ON public.muaythai_fighter_profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT au.auth_user_id FROM app_users au 
      WHERE au.role IN ('admin', 'coach')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_muaythai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_muaythai_fights_updated_at
  BEFORE UPDATE ON public.muaythai_fights
  FOR EACH ROW EXECUTE FUNCTION update_muaythai_updated_at();

CREATE TRIGGER update_muaythai_calculated_stats_updated_at
  BEFORE UPDATE ON public.muaythai_calculated_stats
  FOR EACH ROW EXECUTE FUNCTION update_muaythai_updated_at();

CREATE TRIGGER update_muaythai_fighter_profiles_updated_at
  BEFORE UPDATE ON public.muaythai_fighter_profiles
  FOR EACH ROW EXECUTE FUNCTION update_muaythai_updated_at();
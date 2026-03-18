
-- 1. Analysis cameras per ring (separate from live view camera)
CREATE TABLE public.ring_analysis_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ring_id UUID NOT NULL REFERENCES public.competition_rings(id) ON DELETE CASCADE,
  camera_index SMALLINT NOT NULL CHECK (camera_index BETWEEN 1 AND 4),
  camera_label TEXT NOT NULL DEFAULT 'Camera',
  position TEXT NOT NULL DEFAULT 'front',
  stream_url TEXT,
  is_active BOOLEAN DEFAULT true,
  resolution_width INT DEFAULT 1920,
  resolution_height INT DEFAULT 1080,
  fps INT DEFAULT 160,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ring_id, camera_index)
);

-- 2. AI Analysis sessions
CREATE TABLE public.ai_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ring_id UUID NOT NULL REFERENCES public.competition_rings(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.competition_matches(id) ON DELETE SET NULL,
  competition_id UUID REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'live',
  sport TEXT NOT NULL DEFAULT 'muay_thai',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_rounds INT DEFAULT 0,
  cameras_used INT DEFAULT 1,
  results JSONB DEFAULT '{}',
  error_message TEXT,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AI Analysis round results
CREATE TABLE public.ai_analysis_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_analysis_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  red_corner_data JSONB DEFAULT '{}',
  blue_corner_data JSONB DEFAULT '{}',
  round_summary TEXT,
  raw_ai_response JSONB,
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AI Training labels (Phase 3)
CREATE TABLE public.ai_training_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_analysis_sessions(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.competition_matches(id) ON DELETE SET NULL,
  frame_timestamp NUMERIC NOT NULL,
  camera_index SMALLINT DEFAULT 1,
  strike_type TEXT NOT NULL,
  strike_category TEXT NOT NULL,
  fighter_corner TEXT NOT NULL,
  side TEXT,
  is_landed BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  confidence NUMERIC DEFAULT 1.0,
  labeled_by UUID REFERENCES public.app_users(id),
  frame_image_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.ring_analysis_cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_labels ENABLE ROW LEVEL SECURITY;

-- Policies using app_users.role for federation check
CREATE POLICY "Admin/Fed manage cameras"
  ON public.ring_analysis_cameras FOR ALL TO authenticated
  USING (
    public.is_admin_user() OR
    EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'federation')
  );

CREATE POLICY "Admin/Fed manage sessions"
  ON public.ai_analysis_sessions FOR ALL TO authenticated
  USING (
    public.is_admin_user() OR
    EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'federation')
  );

CREATE POLICY "Admin/Fed manage rounds"
  ON public.ai_analysis_rounds FOR ALL TO authenticated
  USING (
    public.is_admin_user() OR
    EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'federation')
  );

CREATE POLICY "Admin/Fed manage labels"
  ON public.ai_training_labels FOR ALL TO authenticated
  USING (
    public.is_admin_user() OR
    EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'federation')
  );

-- Triggers
CREATE TRIGGER update_ring_analysis_cameras_updated_at
  BEFORE UPDATE ON public.ring_analysis_cameras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_analysis_sessions_updated_at
  BEFORE UPDATE ON public.ai_analysis_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

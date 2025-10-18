-- Create jump_test_sessions table
CREATE TABLE IF NOT EXISTS public.jump_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Create jump_test_data table
CREATE TABLE IF NOT EXISTS public.jump_test_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_session_id UUID REFERENCES public.jump_test_sessions(id) ON DELETE CASCADE,
  cmj_height NUMERIC,
  sqj_height NUMERIC,
  dj_height NUMERIC,
  dj_contact_time NUMERIC,
  rsi NUMERIC,
  asymmetry_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.jump_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jump_test_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jump_test_sessions
CREATE POLICY "Admins can manage all jump_test_sessions"
  ON public.jump_test_sessions
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can manage own jump_test_sessions"
  ON public.jump_test_sessions
  FOR ALL
  USING (
    user_id IN (
      SELECT au.id FROM app_users au WHERE au.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT au.id FROM app_users au WHERE au.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for jump_test_data
CREATE POLICY "Admins can manage all jump_test_data"
  ON public.jump_test_data
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can manage own jump_test_data"
  ON public.jump_test_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jump_test_sessions jts
      JOIN app_users au ON au.id = jts.user_id
      WHERE jts.id = jump_test_data.test_session_id
      AND au.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jump_test_sessions jts
      JOIN app_users au ON au.id = jts.user_id
      WHERE jts.id = jump_test_data.test_session_id
      AND au.auth_user_id = auth.uid()
    )
  );
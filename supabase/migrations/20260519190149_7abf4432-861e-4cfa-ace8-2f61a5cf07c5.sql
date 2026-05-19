-- Menstrual cycle tracking
CREATE TABLE public.menstrual_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  period_length INTEGER NOT NULL DEFAULT 5 CHECK (period_length BETWEEN 1 AND 14),
  cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (cycle_length BETWEEN 15 AND 60),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, start_date)
);

CREATE INDEX idx_menstrual_cycles_user ON public.menstrual_cycles(user_id, start_date DESC);

ALTER TABLE public.menstrual_cycles ENABLE ROW LEVEL SECURITY;

-- Owner (the athlete herself) full access
CREATE POLICY "Users manage own cycles"
ON public.menstrual_cycles
FOR ALL
USING (
  user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

-- Coach of that athlete can view (read-only)
CREATE POLICY "Coach can view athlete cycles"
ON public.menstrual_cycles
FOR SELECT
USING (
  user_id IN (
    SELECT au.id FROM public.app_users au
    WHERE au.coach_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
  )
);

-- Admin can view
CREATE POLICY "Admin can view all cycles"
ON public.menstrual_cycles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE TRIGGER update_menstrual_cycles_updated_at
BEFORE UPDATE ON public.menstrual_cycles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
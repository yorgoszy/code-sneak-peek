
CREATE TABLE public.plan_strong_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coach_id UUID,
  created_by UUID,
  name TEXT NOT NULL DEFAULT 'Plan Strong Draft',
  status TEXT NOT NULL DEFAULT 'draft',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_strong_drafts_user ON public.plan_strong_drafts(user_id);
CREATE INDEX idx_plan_strong_drafts_coach ON public.plan_strong_drafts(coach_id);
CREATE INDEX idx_plan_strong_drafts_created_by ON public.plan_strong_drafts(created_by);

ALTER TABLE public.plan_strong_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all plan strong drafts"
ON public.plan_strong_drafts
FOR ALL
USING (public.is_admin_safe(auth.uid()))
WITH CHECK (public.is_admin_safe(auth.uid()));

CREATE POLICY "Coach manages own plan strong drafts"
ON public.plan_strong_drafts
FOR ALL
USING (auth.uid() = coach_id OR auth.uid() = created_by)
WITH CHECK (auth.uid() = coach_id OR auth.uid() = created_by);

CREATE POLICY "Athlete views own plan strong drafts"
ON public.plan_strong_drafts
FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER trg_plan_strong_drafts_updated_at
BEFORE UPDATE ON public.plan_strong_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

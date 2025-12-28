-- Create coach_subscriptions table for coach's athletes
CREATE TABLE public.coach_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id) ON DELETE CASCADE,
  subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id) ON DELETE RESTRICT,
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMP WITH TIME ZONE,
  paused_days_remaining INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies: coaches see their own subscriptions, admins see all
CREATE POLICY "Coach subscriptions: select own or admin"
ON public.coach_subscriptions
FOR SELECT
USING (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

CREATE POLICY "Coach subscriptions: insert own or admin"
ON public.coach_subscriptions
FOR INSERT
WITH CHECK (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

CREATE POLICY "Coach subscriptions: update own or admin"
ON public.coach_subscriptions
FOR UPDATE
USING (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
)
WITH CHECK (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

CREATE POLICY "Coach subscriptions: delete own or admin"
ON public.coach_subscriptions
FOR DELETE
USING (
  public.is_admin_safe(auth.uid())
  OR coach_id = public.get_app_user_id_safe(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_coach_subscriptions_updated_at
  BEFORE UPDATE ON public.coach_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
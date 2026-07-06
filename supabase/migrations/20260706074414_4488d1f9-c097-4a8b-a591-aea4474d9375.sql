
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  source text NOT NULL CHECK (source IN ('gift_card', 'subscription_use', 'manual_adjustment', 'refund')),
  gift_card_id uuid REFERENCES public.gift_cards(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_user_credits_gift_card_id ON public.user_credits(gift_card_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage all credits"
  ON public.user_credits
  FOR ALL
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Users view own credits"
  ON public.user_credits
  FOR SELECT
  USING (user_id = public.get_app_user_id_for_programs(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_user_credit_balance(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::numeric
  FROM public.user_credits
  WHERE user_id = _user_id;
$$;

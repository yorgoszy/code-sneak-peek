
-- Gift Cards table
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  card_type TEXT NOT NULL DEFAULT 'amount' CHECK (card_type IN ('amount', 'subscription')),
  amount NUMERIC(10,2),
  subscription_type_id UUID REFERENCES public.subscription_types(id),
  sender_name TEXT,
  sender_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  created_by UUID REFERENCES public.app_users(id),
  redeemed_by UUID REFERENCES public.app_users(id),
  redeemed_at TIMESTAMPTZ,
  purchase_method TEXT NOT NULL DEFAULT 'manual' CHECK (purchase_method IN ('manual', 'stripe')),
  stripe_payment_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Admin/coach can see all gift cards
CREATE POLICY "Staff can view all gift cards"
ON public.gift_cards FOR SELECT
TO authenticated
USING (public.is_coach_user(auth.uid()));

-- Admin/coach can create gift cards
CREATE POLICY "Staff can create gift cards"
ON public.gift_cards FOR INSERT
TO authenticated
WITH CHECK (public.is_coach_user(auth.uid()));

-- Admin/coach can update gift cards
CREATE POLICY "Staff can update gift cards"
ON public.gift_cards FOR UPDATE
TO authenticated
USING (public.is_coach_user(auth.uid()));

-- Users can view their own redeemed gift cards
CREATE POLICY "Users can view own redeemed gift cards"
ON public.gift_cards FOR SELECT
TO authenticated
USING (redeemed_by = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1));

-- Anyone can view active gift cards by code (for redemption)
CREATE POLICY "Anyone can view active gift cards by code"
ON public.gift_cards FOR SELECT
TO authenticated
USING (status = 'active');

-- Function to generate unique gift card code
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(code_chars, floor(random() * length(code_chars) + 1)::integer, 1);
    IF i IN (4, 8) THEN
      result := result || '-';
    END IF;
  END LOOP;
  
  WHILE EXISTS (SELECT 1 FROM public.gift_cards WHERE code = result) LOOP
    result := '';
    FOR i IN 1..12 LOOP
      result := result || substr(code_chars, floor(random() * length(code_chars) + 1)::integer, 1);
      IF i IN (4, 8) THEN
        result := result || '-';
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

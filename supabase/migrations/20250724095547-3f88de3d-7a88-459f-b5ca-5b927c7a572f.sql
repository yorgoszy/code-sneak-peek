-- Δημιουργία πίνακα για τις προσφορές
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subscription_type_id UUID REFERENCES public.subscription_types(id) ON DELETE CASCADE,
  discounted_price NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'individual', 'selected', 'groups')),
  target_users UUID[] DEFAULT ARRAY[]::UUID[],
  target_groups UUID[] DEFAULT ARRAY[]::UUID[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- RLS policies για offers
CREATE POLICY "Admins can manage all offers" 
ON public.offers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view active offers for them" 
ON public.offers 
FOR SELECT 
USING (
  is_active = true 
  AND start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE
  AND (
    visibility = 'all' 
    OR (visibility = 'individual' AND auth.uid()::text = ANY(SELECT (app_users.auth_user_id)::text FROM app_users WHERE app_users.id = ANY(target_users)))
    OR (visibility = 'selected' AND auth.uid()::text = ANY(SELECT (app_users.auth_user_id)::text FROM app_users WHERE app_users.id = ANY(target_users)))
  )
);

-- Δημιουργία πίνακα για απόδειξες
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_type_id UUID REFERENCES public.subscription_types(id),
  offer_id UUID REFERENCES public.offers(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'stripe',
  receipt_number TEXT NOT NULL UNIQUE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS για receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies για receipts
CREATE POLICY "Admins can manage all receipts" 
ON public.receipts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own receipts" 
ON public.receipts 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

-- Function για αυτόματη γέννηση receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NEW.issued_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NEW.created_at)::text, 10, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger για αυτόματη γέννηση receipt number
CREATE TRIGGER generate_receipt_number_trigger
  BEFORE INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();

-- Function για updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers για updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
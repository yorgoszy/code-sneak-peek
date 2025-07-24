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

-- Function για αυτόματη γέννηση receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NEW.issued_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NEW.created_at)::text, 10, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger για αυτόματη γέννηση receipt number (αν δεν υπάρχει ήδη)
DROP TRIGGER IF EXISTS generate_receipt_number_trigger ON public.receipts;
CREATE TRIGGER generate_receipt_number_trigger
  BEFORE INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();

-- Triggers για updated_at
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
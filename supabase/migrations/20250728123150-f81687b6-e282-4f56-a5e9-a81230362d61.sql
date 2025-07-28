-- Βήμα 1: Δημιουργία νέας δομής βάσης δεδομένων για Μαγικά Κουτιά

-- Δημιουργία πίνακα εκστρατειών (campaigns)
CREATE TABLE IF NOT EXISTS public.magic_box_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_participations_per_user INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Δημιουργία πίνακα βραβείων με βάρη (weights)
CREATE TABLE IF NOT EXISTS public.campaign_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.magic_box_campaigns(id) ON DELETE CASCADE,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('subscription', 'discount_coupon', 'try_again', 'nothing')),
  subscription_type_id UUID, -- References subscription_types.id
  discount_percentage INTEGER DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  remaining_quantity INTEGER NOT NULL DEFAULT 1,
  weight INTEGER NOT NULL DEFAULT 1, -- Βάρος για weighted random selection
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Βεβαιωθούμε ότι τα subscription prizes έχουν subscription_type_id
  CONSTRAINT check_subscription_type CHECK (
    (prize_type = 'subscription' AND subscription_type_id IS NOT NULL) OR
    (prize_type != 'subscription')
  )
);

-- Δημιουργία πίνακα συμμετοχών χρηστών
CREATE TABLE IF NOT EXISTS public.user_campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.magic_box_campaigns(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES public.campaign_prizes(id) ON DELETE SET NULL,
  result_type TEXT NOT NULL CHECK (result_type IN ('subscription', 'discount_coupon', 'try_again', 'nothing')),
  subscription_type_id UUID,
  discount_percentage INTEGER DEFAULT 0,
  discount_code TEXT,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ένας χρήστης μπορεί να συμμετέχει μόνο μία φορά ανά campaign (εκτός αν επιτρέπεται)
  UNIQUE(user_id, campaign_id, created_at)
);

-- Δημιουργία πίνακα κουπονιών έκπτωσης
CREATE TABLE IF NOT EXISTS public.user_discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  participation_id UUID REFERENCES public.user_campaign_participations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ενεργοποίηση RLS
ALTER TABLE public.magic_box_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_discount_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies για campaigns
CREATE POLICY "Users can view active campaigns" ON public.magic_box_campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage campaigns" ON public.magic_box_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid() 
      AND app_users.role = 'admin'
    )
  );

-- RLS Policies για prizes  
CREATE POLICY "Users can view prizes of active campaigns" ON public.campaign_prizes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.magic_box_campaigns 
      WHERE magic_box_campaigns.id = campaign_prizes.campaign_id 
      AND magic_box_campaigns.is_active = true
    )
  );

CREATE POLICY "Admins can manage prizes" ON public.campaign_prizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid() 
      AND app_users.role = 'admin'
    )
  );

-- RLS Policies για participations
CREATE POLICY "Users can view their own participations" ON public.user_campaign_participations
  FOR SELECT USING (
    user_id IN (
      SELECT app_users.id FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own participations" ON public.user_campaign_participations
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT app_users.id FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all participations" ON public.user_campaign_participations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid() 
      AND app_users.role = 'admin'
    )
  );

-- RLS Policies για coupons
CREATE POLICY "Users can view their own coupons" ON public.user_discount_coupons
  FOR SELECT USING (
    user_id IN (
      SELECT app_users.id FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all coupons" ON public.user_discount_coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE app_users.auth_user_id = auth.uid() 
      AND app_users.role = 'admin'
    )
  );

-- Triggers για updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_magic_box_campaigns_updated_at
  BEFORE UPDATE ON public.magic_box_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_updated_at();

CREATE TRIGGER update_campaign_prizes_updated_at
  BEFORE UPDATE ON public.campaign_prizes
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_updated_at();

-- Μετακίνηση δεδομένων από το παλιό σύστημα
INSERT INTO public.magic_box_campaigns (id, name, description, is_active, created_at, updated_at)
SELECT id, name, description, is_active, created_at, updated_at
FROM public.magic_boxes;

-- Μετακίνηση prizes από το παλιό σύστημα
INSERT INTO public.campaign_prizes (
  campaign_id, 
  prize_type, 
  subscription_type_id, 
  discount_percentage, 
  quantity, 
  remaining_quantity,
  weight,
  created_at, 
  updated_at
)
SELECT 
  magic_box_id,
  'subscription' as prize_type,
  subscription_type_id,
  discount_percentage,
  quantity,
  quantity as remaining_quantity,
  quantity as weight, -- Χρησιμοποιούμε quantity ως αρχικό weight
  created_at,
  updated_at
FROM public.magic_box_subscription_prizes;
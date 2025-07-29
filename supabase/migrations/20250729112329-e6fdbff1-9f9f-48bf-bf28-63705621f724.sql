-- Δημιουργία τράπεζας δώρων για κάθε καμπάνια
CREATE TABLE public.campaign_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('subscription', 'discount_coupon', 'visit_package', 'videocall_package', 'try_again', 'nothing')),
  subscription_type_id UUID,
  discount_percentage INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  videocall_count INTEGER DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 1, -- Βάρος πιθανότητας (1-100)
  total_quantity INTEGER DEFAULT NULL, -- NULL = απεριόριστο
  remaining_quantity INTEGER DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (campaign_id) REFERENCES public.magic_box_campaigns(id) ON DELETE CASCADE
);

-- Δημιουργία μεμονωμένων magic boxes για κάθε χρήστη ανά καμπάνια
CREATE TABLE public.user_magic_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  is_opened BOOLEAN NOT NULL DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  won_prize_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (campaign_id) REFERENCES public.magic_box_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (won_prize_id) REFERENCES public.campaign_prizes(id),
  UNIQUE(user_id, campaign_id) -- Ένα magic box ανά χρήστη ανά καμπάνια
);

-- Ενημέρωση της υπάρχουσας τράπεζας participations να δείχνει στο magic box
ALTER TABLE public.user_campaign_participations 
ADD COLUMN magic_box_id UUID REFERENCES public.user_magic_boxes(id);

-- Indices για καλύτερη απόδοση
CREATE INDEX idx_campaign_prizes_campaign_id ON public.campaign_prizes(campaign_id);
CREATE INDEX idx_campaign_prizes_active ON public.campaign_prizes(campaign_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_magic_boxes_user_campaign ON public.user_magic_boxes(user_id, campaign_id);
CREATE INDEX idx_user_magic_boxes_campaign_opened ON public.user_magic_boxes(campaign_id, is_opened);

-- RLS Policies για campaign_prizes
ALTER TABLE public.campaign_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign prizes" 
ON public.campaign_prizes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));

CREATE POLICY "Users can view active campaign prizes" 
ON public.campaign_prizes 
FOR SELECT 
USING (is_active = true);

-- RLS Policies για user_magic_boxes
ALTER TABLE public.user_magic_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all magic boxes" 
ON public.user_magic_boxes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));

CREATE POLICY "Users can view their own magic boxes" 
ON public.user_magic_boxes 
FOR SELECT 
USING (user_id IN (
  SELECT app_users.id FROM app_users 
  WHERE app_users.auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own magic boxes" 
ON public.user_magic_boxes 
FOR UPDATE 
USING (user_id IN (
  SELECT app_users.id FROM app_users 
  WHERE app_users.auth_user_id = auth.uid()
));

-- Trigger για ενημέρωση updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_prizes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_prizes_updated_at
  BEFORE UPDATE ON public.campaign_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_prizes_updated_at();

CREATE OR REPLACE FUNCTION public.update_user_magic_boxes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_magic_boxes_updated_at
  BEFORE UPDATE ON public.user_magic_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_magic_boxes_updated_at();
-- Create magic_boxes table for admin-created offers
CREATE TABLE public.magic_boxes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create magic_box_prizes table for subscription type prizes
CREATE TABLE public.magic_box_prizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  magic_box_id uuid NOT NULL REFERENCES public.magic_boxes(id) ON DELETE CASCADE,
  subscription_type_id uuid REFERENCES public.subscription_types(id),
  quantity integer NOT NULL DEFAULT 1,
  discount_percentage integer DEFAULT 0,
  prize_type text NOT NULL DEFAULT 'subscription' CHECK (prize_type IN ('subscription', 'discount_coupon')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_magic_box_wins table to track what users won
CREATE TABLE public.user_magic_box_wins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id),
  magic_box_id uuid NOT NULL REFERENCES public.magic_boxes(id),
  prize_id uuid REFERENCES public.magic_box_prizes(id),
  prize_type text NOT NULL,
  subscription_type_id uuid REFERENCES public.subscription_types(id),
  discount_percentage integer DEFAULT 0,
  is_claimed boolean NOT NULL DEFAULT false,
  won_at timestamp with time zone NOT NULL DEFAULT now(),
  claimed_at timestamp with time zone
);

-- Create discount_coupons table for coupon prizes
CREATE TABLE public.discount_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id),
  code text NOT NULL UNIQUE,
  discount_percentage integer NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone
);

-- Enable RLS on all tables
ALTER TABLE public.magic_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_box_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_magic_box_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for magic_boxes
CREATE POLICY "Admins can manage magic boxes" 
ON public.magic_boxes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view active magic boxes" 
ON public.magic_boxes 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for magic_box_prizes
CREATE POLICY "Admins can manage magic box prizes" 
ON public.magic_box_prizes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view prizes for active magic boxes" 
ON public.magic_box_prizes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.magic_boxes 
  WHERE id = magic_box_prizes.magic_box_id AND is_active = true
));

-- RLS Policies for user_magic_box_wins
CREATE POLICY "Admins can view all wins" 
ON public.user_magic_box_wins 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own wins" 
ON public.user_magic_box_wins 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own wins" 
ON public.user_magic_box_wins 
FOR UPDATE 
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

-- RLS Policies for discount_coupons
CREATE POLICY "Admins can manage all coupons" 
ON public.discount_coupons 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own coupons" 
ON public.discount_coupons 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own coupons" 
ON public.discount_coupons 
FOR UPDATE 
USING (user_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

-- Create function to generate unique coupon codes
CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code_length integer := 8;
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists, if so generate a new one
  WHILE EXISTS (SELECT 1 FROM public.discount_coupons WHERE code = result) LOOP
    result := '';
    FOR i IN 1..code_length LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;
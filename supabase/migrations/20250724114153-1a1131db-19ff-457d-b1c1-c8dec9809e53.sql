-- Create table for rejected offers to track user rejections
CREATE TABLE public.offer_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  offer_id UUID NOT NULL,
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

-- Enable RLS
ALTER TABLE public.offer_rejections ENABLE ROW LEVEL SECURITY;

-- Create policies for offer rejections
CREATE POLICY "Users can view their own offer rejections" 
ON public.offer_rejections 
FOR SELECT 
USING (user_id IN (
  SELECT app_users.id 
  FROM app_users 
  WHERE app_users.auth_user_id = auth.uid()
));

CREATE POLICY "Users can insert their own offer rejections" 
ON public.offer_rejections 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT app_users.id 
  FROM app_users 
  WHERE app_users.auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all offer rejections" 
ON public.offer_rejections 
FOR ALL 
USING (EXISTS (
  SELECT 1 
  FROM app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));
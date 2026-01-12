-- Create mydata_settings table for storing AADE MyData credentials
CREATE TABLE public.mydata_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aade_user_id TEXT NOT NULL,
  subscription_key TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_send BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mydata_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/edit mydata settings
CREATE POLICY "Admins can view mydata settings"
ON public.mydata_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert mydata settings"
ON public.mydata_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update mydata settings"
ON public.mydata_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insert your default settings
INSERT INTO public.mydata_settings (aade_user_id, subscription_key, vat_number, environment, enabled, auto_send)
VALUES ('Hyperkids', '6a1bc2b0ad328f1971a203175834caa4', '129785009', 'production', true, true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mydata_settings_updated_at
BEFORE UPDATE ON public.mydata_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
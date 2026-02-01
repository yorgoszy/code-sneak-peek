-- Create health_cards table
CREATE TABLE public.health_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_health_card UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.health_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own health card" 
ON public.health_cards 
FOR SELECT 
USING (auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE id = user_id
) OR auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE role IN ('admin', 'trainer', 'coach')
));

CREATE POLICY "Users can insert their own health card" 
ON public.health_cards 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE id = user_id
) OR auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE role IN ('admin', 'trainer', 'coach')
));

CREATE POLICY "Users can update their own health card" 
ON public.health_cards 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE id = user_id
) OR auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE role IN ('admin', 'trainer', 'coach')
));

CREATE POLICY "Users can delete their own health card" 
ON public.health_cards 
FOR DELETE 
USING (auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE id = user_id
) OR auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE role IN ('admin', 'trainer', 'coach')
));

-- Create storage bucket for health card images
INSERT INTO storage.buckets (id, name, public) VALUES ('health-cards', 'health-cards', true);

-- Storage policies
CREATE POLICY "Anyone can view health card images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'health-cards');

CREATE POLICY "Authenticated users can upload health card images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'health-cards' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own health card images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'health-cards' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own health card images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'health-cards' AND auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_health_cards_updated_at
BEFORE UPDATE ON public.health_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Προσθήκη νέου πίνακα για πολλαπλές συνδρομές στα μαγικά κουτιά
CREATE TABLE IF NOT EXISTS public.magic_box_subscription_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  magic_box_id UUID NOT NULL REFERENCES public.magic_boxes(id) ON DELETE CASCADE,
  subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  discount_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.magic_box_subscription_prizes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage subscription prizes" 
ON public.magic_box_subscription_prizes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));

-- Create trigger for updated_at
CREATE TRIGGER update_magic_box_subscription_prizes_updated_at
BEFORE UPDATE ON public.magic_box_subscription_prizes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
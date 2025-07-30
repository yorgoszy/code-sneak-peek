-- Δημιουργία πίνακα για απαντήσεις προσφορών
CREATE TABLE public.offer_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.offer_responses ENABLE ROW LEVEL SECURITY;

-- Admins can manage all responses
CREATE POLICY "Admins can manage all offer responses" ON public.offer_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.auth_user_id = auth.uid() 
      AND app_users.role = 'admin'
    )
  );

-- Users can view their own responses
CREATE POLICY "Users can view their own offer responses" ON public.offer_responses
  FOR SELECT USING (
    user_id IN (
      SELECT app_users.id FROM app_users 
      WHERE app_users.auth_user_id = auth.uid()
    )
  );

-- Users can insert their own responses
CREATE POLICY "Users can insert their own offer responses" ON public.offer_responses
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT app_users.id FROM app_users 
      WHERE app_users.auth_user_id = auth.uid()
    )
  );

-- Trigger για updated_at
CREATE TRIGGER update_offer_responses_updated_at
  BEFORE UPDATE ON public.offer_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
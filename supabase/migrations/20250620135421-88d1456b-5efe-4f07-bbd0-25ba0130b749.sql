
-- Πίνακας για τύπους συνδρομών
CREATE TABLE public.subscription_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL,
  duration_days integer NOT NULL, -- διάρκεια σε ημέρες
  features jsonb DEFAULT '{}', -- χαρακτηριστικά (AI access, κτλ)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Πίνακας για συνδρομές χρηστών
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  subscription_type_id uuid NOT NULL REFERENCES public.subscription_types(id),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  payment_id uuid REFERENCES public.payments(id),
  auto_renewal boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ενημέρωση πίνακα app_users για subscription status
ALTER TABLE public.app_users 
ADD COLUMN subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired'));

-- Προσθήκη στον πίνακα payments για συσχέτιση με συνδρομές
ALTER TABLE public.payments 
ADD COLUMN subscription_type_id uuid REFERENCES public.subscription_types(id),
ADD COLUMN subscription_duration_days integer;

-- Function για έλεγχο ενεργής συνδρομής
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_subscriptions us
    JOIN public.app_users au ON us.user_id = au.id
    WHERE au.id = user_uuid
      AND us.status = 'active'
      AND us.end_date >= CURRENT_DATE
  ) OR EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE id = user_uuid 
      AND (subscription_status = 'active' OR role = 'admin')
  );
$$;

-- Ευρετήρια
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);

-- Trigger για ενημέρωση updated_at
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Όλοι μπορούν να βλέπουν τους τύπους συνδρομών
CREATE POLICY "Everyone can view subscription types" ON public.subscription_types
  FOR SELECT USING (is_active = true);

-- Χρήστες βλέπουν μόνο τις δικές τους συνδρομές
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

-- Admins μπορούν να βλέπουν όλες τις συνδρομές
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Προσθήκη βασικών τύπων συνδρομών
INSERT INTO public.subscription_types (name, description, price, duration_days, features) VALUES
('Βασικό', 'Βασική συνδρομή με πρόσβαση στον RID AI', 9.99, 30, '{"ai_access": true, "max_conversations": 100}'),
('Premium', 'Premium συνδρομή με απεριόριστη πρόσβαση', 19.99, 30, '{"ai_access": true, "max_conversations": -1, "priority_support": true}'),
('Ετήσιο', 'Ετήσια συνδρομή με έκπτωση', 199.99, 365, '{"ai_access": true, "max_conversations": -1, "priority_support": true, "discount": true}');

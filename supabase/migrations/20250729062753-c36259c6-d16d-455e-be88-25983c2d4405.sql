-- Δημιουργία πίνακα για το tracking των acknowledged payments
CREATE TABLE IF NOT EXISTS public.acknowledged_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  payment_id UUID NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, payment_id)
);

-- Enable RLS
ALTER TABLE public.acknowledged_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies για acknowledged_payments
CREATE POLICY "Admins can manage acknowledged payments" 
ON public.acknowledged_payments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

-- Index για καλύτερη performance
CREATE INDEX IF NOT EXISTS idx_acknowledged_payments_admin_user_id ON public.acknowledged_payments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_acknowledged_payments_payment_id ON public.acknowledged_payments(payment_id);
-- Create coach_receipts table for storing income receipts
CREATE TABLE public.coach_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.app_users(id),
  coach_user_id UUID NOT NULL REFERENCES public.coach_users(id),
  subscription_id UUID REFERENCES public.coach_subscriptions(id),
  receipt_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  receipt_type TEXT NOT NULL DEFAULT 'subscription', -- 'subscription', 'renewal'
  subscription_type_id UUID REFERENCES public.subscription_types(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Coaches can view their own receipts"
ON public.coach_receipts
FOR SELECT
USING (coach_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Coaches can insert their own receipts"
ON public.coach_receipts
FOR INSERT
WITH CHECK (coach_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Coaches can update their own receipts"
ON public.coach_receipts
FOR UPDATE
USING (coach_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Coaches can delete their own receipts"
ON public.coach_receipts
FOR DELETE
USING (coach_id IN (
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_coach_receipts_coach_id ON public.coach_receipts(coach_id);
CREATE INDEX idx_coach_receipts_created_at ON public.coach_receipts(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_coach_receipts_updated_at
BEFORE UPDATE ON public.coach_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
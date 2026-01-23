-- Create table for acknowledged gym bookings (like acknowledged_payments)
CREATE TABLE public.acknowledged_gym_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.booking_sessions(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, admin_user_id)
);

-- Enable RLS
ALTER TABLE public.acknowledged_gym_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own acknowledgments"
  ON public.acknowledged_gym_bookings FOR SELECT
  USING (admin_user_id = auth.uid() OR admin_user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own acknowledgments"
  ON public.acknowledged_gym_bookings FOR INSERT
  WITH CHECK (admin_user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own acknowledgments"
  ON public.acknowledged_gym_bookings FOR DELETE
  USING (admin_user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));
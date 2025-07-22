-- Create booking sections table for admin to manage gym sections/areas
CREATE TABLE public.booking_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  available_hours JSONB DEFAULT '{"monday": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], "tuesday": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], "wednesday": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], "thursday": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], "friday": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], "saturday": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"], "sunday": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking sessions table for user bookings
CREATE TABLE public.booking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section_id UUID NOT NULL REFERENCES public.booking_sections(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE NULL,
  notes TEXT,
  booking_type TEXT NOT NULL DEFAULT 'gym_visit' CHECK (booking_type IN ('gym_visit', 'videocall'))
);

-- Enable RLS on booking_sections
ALTER TABLE public.booking_sections ENABLE ROW LEVEL SECURITY;

-- Admins can manage all booking sections
CREATE POLICY "Admins can manage booking sections" ON public.booking_sections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

-- Users can view active booking sections
CREATE POLICY "Users can view active booking sections" ON public.booking_sections
FOR SELECT USING (is_active = true);

-- Enable RLS on booking_sessions
ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all booking sessions
CREATE POLICY "Admins can manage all booking sessions" ON public.booking_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

-- Users can manage their own booking sessions
CREATE POLICY "Users can manage their own booking sessions" ON public.booking_sessions
FOR ALL USING (
  user_id IN (
    SELECT app_users.id FROM public.app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
);

-- Create function to get user's available bookings based on their subscription
CREATE OR REPLACE FUNCTION public.get_user_available_bookings(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  hypergym_subscription RECORD;
  visit_packages_total INTEGER := 0;
  visit_packages_used INTEGER := 0;
  monthly_bookings_used INTEGER := 0;
  result JSONB;
BEGIN
  -- Check for active hypergym subscription (12 sessions per month)
  SELECT us.*, st.name, st.visit_count
  INTO hypergym_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.end_date >= CURRENT_DATE
    AND st.name ILIKE '%hypergym%'
  LIMIT 1;

  -- Check visit packages
  SELECT 
    COALESCE(SUM(total_visits), 0),
    COALESCE(SUM(total_visits - remaining_visits), 0)
  INTO visit_packages_total, visit_packages_used
  FROM public.visit_packages
  WHERE user_id = user_uuid
    AND status = 'active'
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

  -- If user has hypergym subscription, check monthly usage
  IF hypergym_subscription.id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO monthly_bookings_used
    FROM public.booking_sessions bs
    WHERE bs.user_id = user_uuid
      AND bs.status IN ('confirmed', 'completed')
      AND bs.booking_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND bs.booking_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

    result := jsonb_build_object(
      'type', 'hypergym',
      'total_monthly', 12,
      'used_monthly', monthly_bookings_used,
      'available_monthly', GREATEST(0, 12 - monthly_bookings_used),
      'subscription_name', hypergym_subscription.name
    );
  ELSIF visit_packages_total > 0 THEN
    result := jsonb_build_object(
      'type', 'visit_packages',
      'total_visits', visit_packages_total,
      'used_visits', visit_packages_used,
      'available_visits', GREATEST(0, visit_packages_total - visit_packages_used)
    );
  ELSE
    result := jsonb_build_object(
      'type', 'none',
      'available', 0
    );
  END IF;

  RETURN result;
END;
$$;

-- Create function to check if booking can be cancelled (12 hours before)
CREATE OR REPLACE FUNCTION public.can_cancel_booking(booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  booking_datetime TIMESTAMP;
BEGIN
  SELECT (booking_date + booking_time)::TIMESTAMP
  INTO booking_datetime
  FROM public.booking_sessions
  WHERE id = booking_id;
  
  RETURN booking_datetime > (NOW() + INTERVAL '12 hours');
END;
$$;

-- Insert default booking section
INSERT INTO public.booking_sections (name, description, max_capacity) 
VALUES ('Κύριο Γυμναστήριο', 'Το κύριο χώρος του γυμναστηρίου', 20);

-- Add triggers for updated_at
CREATE TRIGGER update_booking_sections_updated_at
BEFORE UPDATE ON public.booking_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_sessions_updated_at
BEFORE UPDATE ON public.booking_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
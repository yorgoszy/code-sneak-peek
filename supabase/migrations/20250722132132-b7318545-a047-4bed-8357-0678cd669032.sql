-- Fix search path for security functions
CREATE OR REPLACE FUNCTION public.get_user_available_bookings(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.can_cancel_booking(booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
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
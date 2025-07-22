-- Insert videocall subscription type
INSERT INTO public.subscription_types (
  name,
  description,
  price,
  duration_months,
  subscription_mode,
  is_active,
  available_in_shop
) VALUES (
  'Videocall Coaching',
  'Μηνιαία συνδρομή για online coaching συνεδρίες με τον προπονητή σου',
  29.99,
  1,
  'time_based',
  true,
  true
);

-- Update the get_user_available_bookings function to support videocall subscriptions
CREATE OR REPLACE FUNCTION public.get_user_available_bookings(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hypergym_subscription RECORD;
  videocall_subscription RECORD;
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

  -- Check for active videocall subscription
  SELECT us.*, st.name
  INTO videocall_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.end_date >= CURRENT_DATE
    AND st.name ILIKE '%videocall%'
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

  -- Build result based on available subscriptions
  IF hypergym_subscription.id IS NOT NULL THEN
    -- Count monthly gym bookings for hypergym
    SELECT COUNT(*)
    INTO monthly_bookings_used
    FROM public.booking_sessions bs
    WHERE bs.user_id = user_uuid
      AND bs.status IN ('confirmed', 'completed')
      AND bs.booking_type = 'gym_visit'
      AND bs.booking_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND bs.booking_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

    result := jsonb_build_object(
      'type', 'hypergym',
      'total_monthly', 12,
      'used_monthly', monthly_bookings_used,
      'available_monthly', GREATEST(0, 12 - monthly_bookings_used),
      'subscription_name', hypergym_subscription.name,
      'has_videocall', videocall_subscription.id IS NOT NULL,
      'videocall_subscription', CASE 
        WHEN videocall_subscription.id IS NOT NULL 
        THEN videocall_subscription.name 
        ELSE NULL 
      END
    );
  ELSIF videocall_subscription.id IS NOT NULL THEN
    result := jsonb_build_object(
      'type', 'videocall',
      'subscription_name', videocall_subscription.name,
      'has_videocall', true,
      'has_gym_access', false
    );
  ELSIF visit_packages_total > 0 THEN
    result := jsonb_build_object(
      'type', 'visit_packages',
      'total_visits', visit_packages_total,
      'used_visits', visit_packages_used,
      'available_visits', GREATEST(0, visit_packages_total - visit_packages_used),
      'has_videocall', false
    );
  ELSE
    result := jsonb_build_object(
      'type', 'none',
      'available', 0,
      'has_videocall', false
    );
  END IF;

  RETURN result;
END;
$$;
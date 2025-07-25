-- Complete the remaining functions with search_path

CREATE OR REPLACE FUNCTION public.notify_next_in_waiting_list(p_section_id uuid, p_booking_date date, p_booking_time time without time zone, p_booking_type text DEFAULT 'gym_visit'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_user_id UUID;
  waiting_list_id UUID;
BEGIN
  -- Βρες τον επόμενο στη σειρά
  SELECT user_id, id 
  INTO next_user_id, waiting_list_id
  FROM booking_waiting_list 
  WHERE section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time
    AND booking_type = p_booking_type
    AND status = 'waiting'
  ORDER BY position ASC
  LIMIT 1;
  
  IF next_user_id IS NOT NULL THEN
    -- Ενημέρωση κατάστασης σε 'notified'
    UPDATE booking_waiting_list 
    SET status = 'notified',
        notified_at = now(),
        updated_at = now()
    WHERE id = waiting_list_id;
    
    -- Στείλε email notification
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'waiting_list_available',
        'userId', next_user_id,
        'sectionId', p_section_id,
        'bookingDate', p_booking_date,
        'bookingTime', p_booking_time,
        'bookingType', p_booking_type
      )::jsonb
    );
  END IF;
  
  RETURN next_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_available_bookings(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  hypergym_subscription RECORD;
  videocall_subscription RECORD;
  single_videocall_purchases INTEGER := 0;
  visit_packages_total INTEGER := 0;
  visit_packages_used INTEGER := 0;
  videocall_packages_total INTEGER := 0;
  videocall_packages_used INTEGER := 0;
  videocall_packages_available INTEGER := 0;
  monthly_bookings_used INTEGER := 0;
  result JSONB;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = user_uuid) THEN
    RETURN jsonb_build_object(
      'type', 'none',
      'available', 0,
      'error', 'User not found'
    );
  END IF;

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

  -- Check for active monthly videocall subscription
  SELECT us.*, st.name
  INTO videocall_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.end_date >= CURRENT_DATE
    AND st.name ILIKE '%videocall coaching%'
  LIMIT 1;

  -- Count available single videocall purchases
  SELECT COALESCE(COUNT(*), 0)
  INTO single_videocall_purchases
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND st.single_purchase = true
    AND st.name ILIKE '%videocall session%';

  -- Check visit packages (including those from visit-based subscriptions)
  SELECT 
    COALESCE(SUM(total_visits), 0),
    COALESCE(SUM(total_visits - remaining_visits), 0)
  INTO visit_packages_total, visit_packages_used
  FROM public.visit_packages
  WHERE user_id = user_uuid
    AND status = 'active'
    AND remaining_visits > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

  -- Check videocall packages
  SELECT 
    COALESCE(SUM(total_videocalls), 0),
    COALESCE(SUM(total_videocalls - remaining_videocalls), 0)
  INTO videocall_packages_total, videocall_packages_used
  FROM public.videocall_packages
  WHERE user_id = user_uuid
    AND status = 'active'
    AND remaining_videocalls > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

  -- Calculate available videocall packages
  videocall_packages_available := GREATEST(0, videocall_packages_total - videocall_packages_used);

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
      'has_videocall', videocall_subscription.id IS NOT NULL OR single_videocall_purchases > 0 OR videocall_packages_available > 0,
      'single_videocall_sessions', single_videocall_purchases,
      'videocall_packages_available', videocall_packages_available,
      'videocall_subscription', CASE 
        WHEN videocall_subscription.id IS NOT NULL 
        THEN videocall_subscription.name 
        ELSE NULL 
      END
    );
  ELSIF visit_packages_total > 0 THEN
    -- User has visit packages (from visit-based subscriptions or standalone packages)
    result := jsonb_build_object(
      'type', 'visit_packages',
      'total_visits', visit_packages_total,
      'used_visits', visit_packages_used,
      'available_visits', GREATEST(0, visit_packages_total - visit_packages_used),
      'has_videocall', videocall_subscription.id IS NOT NULL OR single_videocall_purchases > 0 OR videocall_packages_available > 0,
      'single_videocall_sessions', single_videocall_purchases,
      'videocall_packages_available', videocall_packages_available,
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
      'single_videocall_sessions', single_videocall_purchases,
      'videocall_packages_available', videocall_packages_available,
      'has_gym_access', false
    );
  ELSIF single_videocall_purchases > 0 OR videocall_packages_available > 0 THEN
    result := jsonb_build_object(
      'type', 'single_videocall',
      'single_videocall_sessions', single_videocall_purchases,
      'videocall_packages_available', videocall_packages_available,
      'has_videocall', true,
      'has_gym_access', false
    );
  ELSE
    result := jsonb_build_object(
      'type', 'none',
      'available', 0,
      'has_videocall', false,
      'single_videocall_sessions', 0,
      'videocall_packages_available', 0
    );
  END IF;

  RETURN result;
END;
$function$;
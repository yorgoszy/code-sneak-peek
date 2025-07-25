-- Fix the final remaining functions with search_path

CREATE OR REPLACE FUNCTION public.notify_user_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object(
      'type', 'user_welcome',
      'userId', NEW.id
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_athlete(athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.force_delete_athlete(athlete_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_athlete_memberships(athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.payments WHERE user_id = $1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_suggested_velocity(athlete_id uuid, exercise_id uuid, percentage numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH latest_1rm AS (
    SELECT weight_kg as max_weight
    FROM public.strength_test_attempts sta
    JOIN public.strength_test_sessions sts ON sta.test_session_id = sts.id
    WHERE sts.user_id = $1 
      AND sta.exercise_id = $2 
      AND sta.is_1rm = true
    ORDER BY sts.test_date DESC, sta.weight_kg DESC
    LIMIT 1
  )
  SELECT AVG(velocity_ms)
  FROM public.strength_test_attempts sta
  JOIN public.strength_test_sessions sts ON sta.test_session_id = sts.id
  JOIN latest_1rm ON true
  WHERE sts.user_id = $1 
    AND sta.exercise_id = $2
    AND latest_1rm.max_weight > 0
    AND ABS((sta.weight_kg / latest_1rm.max_weight * 100) - percentage) <= 10
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_latest_1rm(athlete_id uuid, exercise_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT weight_kg
  FROM public.strength_test_attempts sta
  JOIN public.strength_test_sessions sts ON sta.test_session_id = sts.id
  WHERE sts.user_id = $1 
    AND sta.exercise_id = $2 
    AND sta.is_1rm = true
  ORDER BY sts.test_date DESC, sta.weight_kg DESC
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;
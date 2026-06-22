CREATE OR REPLACE FUNCTION public.notify_trial_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (admin_user_id, notification_type, item_id)
  SELECT au.id, 'trial_request', NEW.id
  FROM public.app_users au
  WHERE au.role = 'admin';

  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/trial-request-notify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object('trialRequestId', NEW.id)::jsonb
  );

  RETURN NEW;
END;
$function$;
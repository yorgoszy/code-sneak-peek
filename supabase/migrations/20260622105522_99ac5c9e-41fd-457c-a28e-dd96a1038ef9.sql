
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS action_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE OR REPLACE FUNCTION public.notify_trial_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- In-app admin notification
  INSERT INTO public.admin_notifications (admin_user_id, type, message, metadata)
  SELECT au.id, 'trial_request', 'Νέο αίτημα δοκιμαστικού από ' || NEW.name,
         jsonb_build_object('trial_request_id', NEW.id, 'email', NEW.email, 'phone', NEW.phone,
                            'preferred_date', NEW.preferred_date, 'preferred_time', NEW.preferred_time)
  FROM public.app_users au
  WHERE au.role = 'admin';

  -- Email to admin via edge function
  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/trial-request-notify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object('trialRequestId', NEW.id)::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trial_request_created ON public.trial_requests;
CREATE TRIGGER trg_notify_trial_request_created
AFTER INSERT ON public.trial_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_trial_request_created();

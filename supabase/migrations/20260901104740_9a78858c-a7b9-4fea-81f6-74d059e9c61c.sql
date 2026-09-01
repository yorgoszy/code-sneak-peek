CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Νέα κράτηση επίσκεψης
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_type = 'gym_visit' THEN
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_created',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );

    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_admin_notification',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );
  END IF;

  -- Ακύρωση κράτησης
  IF TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'pending') AND NEW.status = 'cancelled' THEN
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_cancelled',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );

    PERFORM notify_next_in_waiting_list(NEW.section_id, NEW.booking_date, NEW.booking_time, NEW.booking_type);
  END IF;

  -- Διαγραφή κράτησης
  IF TG_OP = 'DELETE' AND OLD.status IN ('confirmed', 'pending') THEN
    PERFORM notify_next_in_waiting_list(OLD.section_id, OLD.booking_date, OLD.booking_time, OLD.booking_type);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
-- Fix the final two functions with search_path

CREATE OR REPLACE FUNCTION public.notify_offer_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- Αν η προσφορά είναι για συγκεκριμένους χρήστες
  IF NEW.visibility = 'individual' AND NEW.target_users IS NOT NULL THEN
    -- Στείλε email σε κάθε target user
    FOREACH target_user_id IN ARRAY NEW.target_users
    LOOP
      PERFORM net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := json_build_object(
          'type', 'offer_notification',
          'userId', target_user_id,
          'offerId', NEW.id::text
        )::jsonb
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Νέα κράτηση επίσκεψης
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_type = 'gym_visit' THEN
    -- Email confirmation to user
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_created',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );
    
    -- Admin notification for new booking
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_admin_notification',
        'userId', NEW.user_id
      )::jsonb
    );
  END IF;

  -- Ακύρωση κράτησης - ειδοποίηση waiting list
  IF TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'pending') AND NEW.status = 'cancelled' THEN
    -- Email στον χρήστη για την ακύρωση
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_cancelled',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );
    
    -- Ειδοποίηση επόμενου στη waiting list
    PERFORM notify_next_in_waiting_list(NEW.section_id, NEW.booking_date, NEW.booking_time, NEW.booking_type);
  END IF;

  -- Διαγραφή κράτησης - ειδοποίηση waiting list
  IF TG_OP = 'DELETE' AND OLD.status IN ('confirmed', 'pending') THEN
    PERFORM notify_next_in_waiting_list(OLD.section_id, OLD.booking_date, OLD.booking_time, OLD.booking_type);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
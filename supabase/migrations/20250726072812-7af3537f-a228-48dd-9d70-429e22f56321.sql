-- Ενημέρωση της συνάρτησης για να στέλνει email όταν ακυρώνεται βιντεοκλήση
CREATE OR REPLACE FUNCTION public.notify_videocall_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Άμεσο notification για νέες αιτήσεις (pending)
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM
      net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := json_build_object(
          'type', 'booking_pending',
          'bookingId', NEW.id,
          'adminEmail', 'yorgoszy@gmail.com'
        )::jsonb
      );
  END IF;

  -- Notifications για status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Εγκρίθηκε
    IF NEW.status = 'confirmed' THEN
      PERFORM
        net.http_post(
          url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
          body := json_build_object(
            'type', 'booking_approved',
            'bookingId', NEW.id
          )::jsonb
        );
    
    -- Απορρίφθηκε
    ELSIF NEW.status = 'rejected' THEN
      PERFORM
        net.http_post(
          url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
          body := json_build_object(
            'type', 'booking_rejected',
            'bookingId', NEW.id
          )::jsonb
        );
    
    -- Ακυρώθηκε
    ELSIF NEW.status = 'cancelled' THEN
      -- Email στον χρήστη για την ακύρωση
      PERFORM
        net.http_post(
          url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
          body := json_build_object(
            'type', 'booking_cancelled',
            'bookingId', NEW.id
          )::jsonb
        );
      
      -- Email στον admin για την ακύρωση
      PERFORM
        net.http_post(
          url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
          body := json_build_object(
            'type', 'booking_cancelled_admin',
            'bookingId', NEW.id,
            'adminEmail', 'yorgoszy@gmail.com'
          )::jsonb
        );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
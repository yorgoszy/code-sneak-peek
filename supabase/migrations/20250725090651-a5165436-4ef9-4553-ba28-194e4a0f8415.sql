-- Fix the remaining functions that need search_path

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
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.leave_waiting_list(p_user_id uuid, p_section_id uuid, p_booking_date date, p_booking_time time without time zone, p_booking_type text DEFAULT 'gym_visit'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  removed_position INTEGER;
BEGIN
  -- Βρες τη θέση που θα αφαιρεθεί
  SELECT position INTO removed_position
  FROM booking_waiting_list 
  WHERE user_id = p_user_id 
    AND section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time
    AND booking_type = p_booking_type
    AND status = 'waiting';
  
  IF removed_position IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Διαγραφή από waiting list
  DELETE FROM booking_waiting_list 
  WHERE user_id = p_user_id 
    AND section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time
    AND booking_type = p_booking_type;
  
  -- Ενημέρωση θέσεων για όσους είναι μετά
  UPDATE booking_waiting_list 
  SET position = position - 1,
      updated_at = now()
  WHERE section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time
    AND booking_type = p_booking_type
    AND position > removed_position
    AND status = 'waiting';
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_videocall_reminders(reminder_type text, time_window_start interval, time_window_end interval)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    booking RECORD;
BEGIN
    FOR booking IN
        SELECT bs.id, au.email as user_email
        FROM booking_sessions bs
        JOIN app_users au ON bs.user_id = au.id
        WHERE bs.booking_type = 'videocall'
          AND bs.status = 'confirmed'
          AND (
            (reminder_type = 'reminder_24h' AND bs.booking_date = CURRENT_DATE + INTERVAL '1 day') OR
            (reminder_type != 'reminder_24h' AND (bs.booking_date + bs.booking_time)::timestamp 
             BETWEEN (NOW() + time_window_start) AND (NOW() + time_window_end))
          )
    LOOP
        -- Email σε χρήστη
        PERFORM net.http_post(
            url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
            body := json_build_object(
                'type', reminder_type,
                'bookingId', booking.id
            )::jsonb
        );
        
        -- Email σε admin
        PERFORM net.http_post(
            url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
            body := json_build_object(
                'type', reminder_type,
                'bookingId', booking.id,
                'adminEmail', 'yorgoszy@gmail.com'
            )::jsonb
        );
    END LOOP;
END;
$function$;
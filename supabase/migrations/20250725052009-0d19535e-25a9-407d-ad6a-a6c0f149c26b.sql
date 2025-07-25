-- Ενημέρωση του πίνακα booking_waiting_list να υποστηρίζει videocalls
ALTER TABLE public.booking_waiting_list 
ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'gym_visit';

-- Ενημέρωση των υπαρχόντων εγγραφών
UPDATE public.booking_waiting_list 
SET booking_type = 'gym_visit' 
WHERE booking_type IS NULL;

-- Ενημέρωση της join_waiting_list function για videocalls
CREATE OR REPLACE FUNCTION public.join_waiting_list(
  p_user_id uuid, 
  p_section_id uuid, 
  p_booking_date date, 
  p_booking_time time without time zone,
  p_booking_type text DEFAULT 'gym_visit'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_position INTEGER;
  waiting_list_id UUID;
BEGIN
  -- Έλεγχος αν ο χρήστης είναι ήδη στη waiting list
  IF EXISTS (
    SELECT 1 FROM booking_waiting_list 
    WHERE user_id = p_user_id 
      AND section_id = p_section_id 
      AND booking_date = p_booking_date 
      AND booking_time = p_booking_time
      AND booking_type = p_booking_type
      AND status = 'waiting'
  ) THEN
    RAISE EXCEPTION 'User is already in the waiting list for this time slot';
  END IF;
  
  -- Βρες την επόμενη θέση στη σειρά
  SELECT COALESCE(MAX(position), 0) + 1 
  INTO next_position
  FROM booking_waiting_list 
  WHERE section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time
    AND booking_type = p_booking_type
    AND status = 'waiting';
  
  -- Προσθήκη στη waiting list
  INSERT INTO booking_waiting_list (
    user_id, section_id, booking_date, booking_time, position, status, booking_type
  ) VALUES (
    p_user_id, p_section_id, p_booking_date, p_booking_time, next_position, 'waiting', p_booking_type
  ) RETURNING id INTO waiting_list_id;
  
  RETURN waiting_list_id;
END;
$function$;

-- Ενημέρωση της leave_waiting_list function για videocalls
CREATE OR REPLACE FUNCTION public.leave_waiting_list(
  p_user_id uuid, 
  p_section_id uuid, 
  p_booking_date date, 
  p_booking_time time without time zone,
  p_booking_type text DEFAULT 'gym_visit'
)
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

-- Ενημέρωση της notify_next_in_waiting_list function για videocalls
CREATE OR REPLACE FUNCTION public.notify_next_in_waiting_list(
  p_section_id uuid, 
  p_booking_date date, 
  p_booking_time time without time zone,
  p_booking_type text DEFAULT 'gym_visit'
)
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

-- Ενημέρωση της notify_booking_changes trigger function για videocalls
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
-- ================================================
-- WAITING LIST SYSTEM FOR GYM BOOKINGS
-- ================================================

-- Δημιουργία πίνακα για waiting list
CREATE TABLE public.booking_waiting_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT fk_waiting_list_user FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_waiting_list_section FOREIGN KEY (section_id) REFERENCES public.booking_sections(id) ON DELETE CASCADE,
  CONSTRAINT check_status CHECK (status IN ('waiting', 'notified', 'expired', 'cancelled')),
  
  -- Unique constraint για να μην μπει ο ίδιος χρήστης δύο φορές στην ίδια waiting list
  UNIQUE(user_id, section_id, booking_date, booking_time)
);

-- Ευρετήριο για γρήγορη αναζήτηση
CREATE INDEX idx_waiting_list_date_time ON public.booking_waiting_list(section_id, booking_date, booking_time, position);
CREATE INDEX idx_waiting_list_user ON public.booking_waiting_list(user_id);
CREATE INDEX idx_waiting_list_status ON public.booking_waiting_list(status);

-- Enable RLS
ALTER TABLE public.booking_waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own waiting list entries" 
ON public.booking_waiting_list 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can insert their own waiting list entries" 
ON public.booking_waiting_list 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own waiting list entries" 
ON public.booking_waiting_list 
FOR UPDATE 
USING (user_id IN (
  SELECT id FROM app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can delete their own waiting list entries" 
ON public.booking_waiting_list 
FOR DELETE 
USING (user_id IN (
  SELECT id FROM app_users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all waiting list entries" 
ON public.booking_waiting_list 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

-- ================================================
-- FUNCTIONS FOR WAITING LIST MANAGEMENT
-- ================================================

-- Function για προσθήκη χρήστη στη waiting list
CREATE OR REPLACE FUNCTION public.join_waiting_list(
  p_user_id UUID,
  p_section_id UUID,
  p_booking_date DATE,
  p_booking_time TIME
) RETURNS UUID
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
    AND status = 'waiting';
  
  -- Προσθήκη στη waiting list
  INSERT INTO booking_waiting_list (
    user_id, section_id, booking_date, booking_time, position, status
  ) VALUES (
    p_user_id, p_section_id, p_booking_date, p_booking_time, next_position, 'waiting'
  ) RETURNING id INTO waiting_list_id;
  
  RETURN waiting_list_id;
END;
$function$;

-- Function για αφαίρεση από waiting list
CREATE OR REPLACE FUNCTION public.leave_waiting_list(
  p_user_id UUID,
  p_section_id UUID,
  p_booking_date DATE,
  p_booking_time TIME
) RETURNS BOOLEAN
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
    AND status = 'waiting';
  
  IF removed_position IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Διαγραφή από waiting list
  DELETE FROM booking_waiting_list 
  WHERE user_id = p_user_id 
    AND section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time;
  
  -- Ενημέρωση θέσεων για όσους είναι μετά
  UPDATE booking_waiting_list 
  SET position = position - 1,
      updated_at = now()
  WHERE section_id = p_section_id 
    AND booking_date = p_booking_date 
    AND booking_time = p_booking_time
    AND position > removed_position
    AND status = 'waiting';
  
  RETURN TRUE;
END;
$function$;

-- Function για ειδοποίηση επόμενου στη waiting list
CREATE OR REPLACE FUNCTION public.notify_next_in_waiting_list(
  p_section_id UUID,
  p_booking_date DATE,
  p_booking_time TIME
) RETURNS UUID
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
        'bookingTime', p_booking_time
      )::jsonb
    );
  END IF;
  
  RETURN next_user_id;
END;
$function$;

-- ================================================
-- TRIGGER FOR BOOKING CANCELLATIONS
-- ================================================

-- Enhanced booking trigger για waiting list notifications
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

  -- Ακύρωση κράτησης επίσκεψης - ειδοποίηση waiting list
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' AND NEW.booking_type = 'gym_visit' THEN
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
    PERFORM notify_next_in_waiting_list(NEW.section_id, NEW.booking_date, NEW.booking_time);
  END IF;

  -- Διαγραφή κράτησης - ειδοποίηση waiting list
  IF TG_OP = 'DELETE' AND OLD.status = 'confirmed' AND OLD.booking_type = 'gym_visit' THEN
    PERFORM notify_next_in_waiting_list(OLD.section_id, OLD.booking_date, OLD.booking_time);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Trigger για automatic cleanup των expired waiting list entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_waiting_list()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Διαγραφή entries που έχουν λήξει (μετά το booking_date)
  UPDATE booking_waiting_list 
  SET status = 'expired',
      updated_at = now()
  WHERE booking_date < CURRENT_DATE 
    AND status IN ('waiting', 'notified');
END;
$function$;
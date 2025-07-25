-- Fix remaining functions that still need search_path

CREATE OR REPLACE FUNCTION public.join_waiting_list(p_user_id uuid, p_section_id uuid, p_booking_date date, p_booking_time time without time zone, p_booking_type text DEFAULT 'gym_visit'::text)
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

CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_chat_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_file RECORD;
BEGIN
  -- Find expired files
  FOR expired_file IN 
    SELECT file_path FROM public.ai_chat_files 
    WHERE expires_at < now()
  LOOP
    -- Delete from storage
    PERFORM storage.delete(expired_file.file_path);
  END LOOP;
  
  -- Delete expired records
  DELETE FROM public.ai_chat_files WHERE expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_videocall(p_user_id uuid, p_created_by uuid DEFAULT NULL::uuid, p_videocall_type text DEFAULT 'manual'::text, p_notes text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  videocall_id UUID;
  package_id UUID;
BEGIN
  -- Έλεγχος για ενεργό videocall package
  SELECT id INTO package_id
  FROM public.videocall_packages
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND remaining_videocalls > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  ORDER BY purchase_date DESC
  LIMIT 1;
  
  -- Καταγραφή videocall
  INSERT INTO public.user_videocalls (user_id, created_by, videocall_type, notes)
  VALUES (p_user_id, p_created_by, p_videocall_type, p_notes)
  RETURNING id INTO videocall_id;
  
  -- Ενημέρωση videocall package αν υπάρχει
  IF package_id IS NOT NULL THEN
    UPDATE public.videocall_packages 
    SET remaining_videocalls = remaining_videocalls - 1,
        updated_at = now(),
        status = CASE WHEN remaining_videocalls - 1 = 0 THEN 'used' ELSE 'active' END
    WHERE id = package_id;
  END IF;
  
  RETURN videocall_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_cancel_booking(booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_datetime TIMESTAMP;
BEGIN
  SELECT (booking_date + booking_time)::TIMESTAMP
  INTO booking_datetime
  FROM public.booking_sessions
  WHERE id = booking_id;
  
  RETURN booking_datetime > (NOW() + INTERVAL '12 hours');
END;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_gym_booking_sections()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE availability jsonb; sections uuid[]; c uuid;
BEGIN
IF TG_OP='UPDATE' THEN
 IF NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND NEW.section_id IS NOT DISTINCT FROM OLD.section_id AND NEW.booking_type IS NOT DISTINCT FROM OLD.booking_type AND NEW.booking_date IS NOT DISTINCT FROM OLD.booking_date AND NEW.booking_time IS NOT DISTINCT FROM OLD.booking_time THEN RETURN NEW; END IF;
END IF;
IF COALESCE(NEW.booking_type,'gym_visit')<>'gym_visit' THEN RETURN NEW; END IF;
SELECT coach_id INTO c FROM public.booking_sections WHERE id=NEW.section_id;
-- Only server-verified admins may generate a user's explicitly saved recurring slots.
-- Ordinary bookings retain their subscription restrictions; coach calendars never use this exception.
IF c IS NULL AND public.has_role(auth.uid(),'admin') AND EXISTS (
 SELECT 1 FROM public.app_users u
 JOIN public.booking_sections s ON s.id=u.section_id
 JOIN public.user_subscriptions sub ON sub.user_id=u.id
 WHERE u.id=NEW.user_id AND u.section_id=NEW.section_id
 AND (u.coach_id IS NULL OR EXISTS (
  SELECT 1 FROM public.app_users owner JOIN public.user_roles r ON r.user_id=owner.auth_user_id
  WHERE owner.id=u.coach_id AND r.role='admin'
 ))
 AND s.coach_id IS NULL AND s.is_active AND (s.booking_type IS NULL OR s.booking_type='gym_visit')
 AND sub.coach_id IS NULL AND sub.status='active' AND NOT coalesce(sub.is_paused,false)
 AND NEW.booking_date BETWEEN sub.start_date AND sub.end_date
 AND NEW.booking_date >= (now() AT TIME ZONE 'Europe/Athens')::date
 AND EXISTS (
  SELECT 1 FROM public.section_attendance_slots(u.section_schedule,NEW.booking_date,NEW.booking_date) slots
  WHERE slots.booking_time=NEW.booking_time
 )
 AND EXISTS (
  SELECT 1 FROM public.section_attendance_slots(s.available_hours,NEW.booking_date,NEW.booking_date) slots
  WHERE slots.booking_time=NEW.booking_time
 )
) THEN RETURN NEW; END IF;
IF c IS NOT NULL THEN
 availability:=private.get_coach_booking_availability(NEW.user_id);
 IF TG_TABLE_NAME='booking_waiting_list' OR NEW.status IN('pending','confirmed') THEN
  IF availability->>'type'='none' OR COALESCE((availability->>'available_visits')::integer,0)<=0 THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Δεν έχεις ενεργή συνδρομή ή διαθέσιμες επισκέψεις στον coach σου'; END IF;
 END IF;
ELSE availability:=public.get_user_available_bookings(NEW.user_id); END IF;
IF availability->>'type' NOT IN('hypergym','visit_packages') THEN RETURN NEW; END IF;
SELECT COALESCE(array_agg(value::uuid),ARRAY[]::uuid[]) INTO sections FROM jsonb_array_elements_text(COALESCE(availability->'allowed_sections','[]'::jsonb));
IF cardinality(sections)>0 AND NOT(NEW.section_id=ANY(sections)) THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Η συνδρομή σου δεν επιτρέπει κρατήσεις σε αυτό το τμήμα'; END IF;
RETURN NEW;
END $function$;
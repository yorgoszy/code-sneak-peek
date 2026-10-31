ALTER FUNCTION public.get_coach_booking_availability(uuid) SET SCHEMA private;
ALTER FUNCTION private.get_coach_booking_availability(uuid) SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.get_coach_booking_availability(p_user uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$ BEGIN
IF NOT(auth.role()='service_role' OR p_user=public.current_app_user_id() OR public.can_manage_coaching_user(p_user)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
RETURN private.get_coach_booking_availability(p_user); END $$;
REVOKE ALL ON FUNCTION public.get_coach_booking_availability(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.get_coach_booking_availability(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION private.get_coach_booking_availability(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION private.get_coach_booking_availability(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.enforce_gym_booking_sections() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE availability jsonb; sections uuid[]; c uuid; BEGIN
IF TG_OP='UPDATE' THEN IF NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND NEW.section_id IS NOT DISTINCT FROM OLD.section_id AND NEW.booking_type IS NOT DISTINCT FROM OLD.booking_type AND NEW.booking_date IS NOT DISTINCT FROM OLD.booking_date AND NEW.booking_time IS NOT DISTINCT FROM OLD.booking_time THEN RETURN NEW; END IF; END IF;
IF COALESCE(NEW.booking_type,'gym_visit')<>'gym_visit' THEN RETURN NEW; END IF;
SELECT coach_id INTO c FROM public.booking_sections WHERE id=NEW.section_id;
IF c IS NOT NULL THEN
 availability:=private.get_coach_booking_availability(NEW.user_id);
 IF TG_TABLE_NAME='booking_waiting_list' OR NEW.status IN('pending','confirmed') THEN
  IF availability->>'type'='none' OR COALESCE((availability->>'available_visits')::integer,0)<=0 THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Δεν έχεις ενεργή συνδρομή ή διαθέσιμες επισκέψεις στον coach σου'; END IF;
 END IF;
ELSE availability:=public.get_user_available_bookings(NEW.user_id); END IF;
IF availability->>'type' NOT IN('hypergym','visit_packages') THEN RETURN NEW; END IF;
SELECT COALESCE(array_agg(value::uuid),ARRAY[]::uuid[]) INTO sections FROM jsonb_array_elements_text(COALESCE(availability->'allowed_sections','[]'::jsonb));
IF cardinality(sections)>0 AND NOT(NEW.section_id=ANY(sections)) THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Η συνδρομή σου δεν επιτρέπει κρατήσεις σε αυτό το τμήμα'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.enforce_gym_booking_sections() FROM PUBLIC,anon,authenticated;

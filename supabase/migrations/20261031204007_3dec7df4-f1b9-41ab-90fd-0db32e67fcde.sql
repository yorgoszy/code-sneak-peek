DROP INDEX public.coach_gym_calendar;
CREATE INDEX coach_booking_sections ON public.booking_sections(coach_id) WHERE booking_type='gym_visit';
CREATE OR REPLACE FUNCTION public.ensure_coach_booking_calendar(p_coach uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE result uuid; BEGIN
IF NOT(public.has_role(auth.uid(),'admin') OR(p_coach=public.current_app_user_id() AND public.has_role(auth.uid(),'coach'))) THEN RAISE EXCEPTION 'Not authorized'; END IF;
SELECT id INTO result FROM public.booking_sections WHERE coach_id=p_coach AND booking_type='gym_visit' ORDER BY created_at LIMIT 1;
RETURN result; END $$;

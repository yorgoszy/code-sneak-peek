CREATE OR REPLACE FUNCTION public.ensure_coaching_calendar(p_coach uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result uuid; coach_auth uuid; BEGIN
 SELECT auth_user_id INTO coach_auth FROM public.app_users WHERE id=p_coach;
 IF NOT public.has_role(coach_auth,'coach') THEN RAISE EXCEPTION 'Coach unavailable'; END IF;
 IF NOT (public.has_role(auth.uid(),'admin') OR (p_coach=public.current_app_user_id() AND public.has_role(auth.uid(),'coach')) OR public.owns_coaching_user(public.current_app_user_id(),p_coach)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 INSERT INTO public.booking_sections(name,description,coach_id,booking_type,max_capacity,available_hours) VALUES('Online Coaching',NULL,p_coach,'videocall',1,'{}'::jsonb) ON CONFLICT(coach_id) WHERE booking_type='videocall' AND coach_id IS NOT NULL DO NOTHING;
 SELECT id INTO result FROM public.booking_sections WHERE coach_id=p_coach AND booking_type='videocall'; RETURN result;
 END $$;
REVOKE ALL ON FUNCTION public.ensure_coaching_calendar(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_coaching_calendar(uuid) TO authenticated;
ALTER TABLE public.booking_sections ADD COLUMN coach_id uuid REFERENCES public.app_users(id), ADD COLUMN booking_type text;
ALTER TABLE public.booking_sessions ADD COLUMN coach_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.booking_waiting_list ADD COLUMN coach_id uuid REFERENCES public.app_users(id);
CREATE INDEX booking_sessions_coach_dates ON public.booking_sessions(coach_id,booking_date);
CREATE UNIQUE INDEX coach_videocall_calendar ON public.booking_sections(coach_id) WHERE booking_type='videocall' AND coach_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.owns_coaching_user(p_user uuid,p_coach uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.app_users WHERE id=p_user AND coach_id=p_coach); $$;
REVOKE ALL ON FUNCTION public.owns_coaching_user(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owns_coaching_user(uuid,uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.can_manage_coaching_user(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'coach') AND public.owns_coaching_user(p_user,public.current_app_user_id())); $$;
REVOKE ALL ON FUNCTION public.can_manage_coaching_user(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_coaching_user(uuid) TO authenticated,service_role;
CREATE POLICY "Coaches manage own videocall calendar" ON public.booking_sections FOR ALL TO authenticated USING (coach_id=public.current_app_user_id() AND public.has_role(auth.uid(),'coach') AND booking_type='videocall') WITH CHECK (coach_id=public.current_app_user_id() AND public.has_role(auth.uid(),'coach') AND booking_type='videocall');
CREATE POLICY "Isolate coaching calendars" ON public.booking_sections AS RESTRICTIVE FOR SELECT TO authenticated USING (coach_id IS NULL OR public.has_role(auth.uid(),'admin') OR coach_id=public.current_app_user_id() OR public.owns_coaching_user(public.current_app_user_id(),coach_id));
CREATE POLICY "Coaches manage own videocall appointments" ON public.booking_sessions FOR ALL TO authenticated USING (booking_type='videocall' AND coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(user_id)) WITH CHECK (booking_type='videocall' AND coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(user_id));
CREATE POLICY "Isolate videocall appointments" ON public.booking_sessions AS RESTRICTIVE FOR ALL TO authenticated USING (booking_type<>'videocall' OR public.has_role(auth.uid(),'admin') OR user_id=public.current_app_user_id() OR (coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(user_id))) WITH CHECK (booking_type<>'videocall' OR public.has_role(auth.uid(),'admin') OR user_id=public.current_app_user_id() OR (coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(user_id)));
CREATE POLICY "Coaches manage own videocall waiting list" ON public.booking_waiting_list FOR ALL TO authenticated USING (booking_type='videocall' AND coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(user_id)) WITH CHECK (booking_type='videocall' AND coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(user_id));
CREATE OR REPLACE FUNCTION public.enforce_coaching_calendar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.booking_sections%ROWTYPE; assigned uuid; assigned_auth uuid;
BEGIN
 SELECT * INTO s FROM public.booking_sections WHERE id=NEW.section_id;
 IF NEW.booking_type<>'videocall' THEN IF s.coach_id IS NOT NULL THEN RAISE EXCEPTION 'Coach calendars accept videocalls only'; END IF; RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN IF NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND NEW.section_id IS NOT DISTINCT FROM OLD.section_id AND NEW.booking_date IS NOT DISTINCT FROM OLD.booking_date AND NEW.booking_time IS NOT DISTINCT FROM OLD.booking_time AND NEW.booking_type IS NOT DISTINCT FROM OLD.booking_type THEN NEW.coach_id:=OLD.coach_id; RETURN NEW; END IF; END IF;
 SELECT u.coach_id,c.auth_user_id INTO assigned,assigned_auth FROM public.app_users u LEFT JOIN public.app_users c ON c.id=u.coach_id WHERE u.id=NEW.user_id;
 IF s.coach_id IS NOT NULL THEN
  IF assigned IS DISTINCT FROM s.coach_id OR s.booking_type IS DISTINCT FROM 'videocall' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Μπορείς να κλείσεις μόνο στο ημερολόγιο του δικού σου coach'; END IF;
 ELSE
  IF assigned IS NOT NULL AND NOT public.has_role(assigned_auth,'admin') THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Μπορείς να κλείσεις μόνο στο ημερολόγιο του δικού σου coach'; END IF;
 END IF;
 IF COALESCE(auth.role(),'')<>'service_role' AND NOT public.has_role(auth.uid(),'admin') AND NEW.user_id IS DISTINCT FROM public.current_app_user_id() AND NOT (s.coach_id=public.current_app_user_id() AND public.can_manage_coaching_user(NEW.user_id)) THEN RAISE EXCEPTION 'Not authorized for this coaching user'; END IF;
 IF NOT COALESCE(s.is_active,false) THEN RAISE EXCEPTION 'Calendar inactive'; END IF;
 NEW.coach_id:=s.coach_id;
 IF TG_TABLE_NAME='booking_sessions' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.section_id::text||NEW.booking_date::text||NEW.booking_time::text,0));
  IF EXISTS(SELECT 1 FROM public.booking_sessions b WHERE b.section_id=NEW.section_id AND b.booking_date=NEW.booking_date AND b.booking_time=NEW.booking_time AND b.booking_type='videocall' AND b.status IN ('pending','confirmed') AND b.id<>NEW.id) THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Η ώρα έχει ήδη κρατηθεί'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER enforce_coaching_calendar BEFORE INSERT OR UPDATE ON public.booking_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_coaching_calendar();
CREATE TRIGGER enforce_coaching_calendar BEFORE INSERT OR UPDATE ON public.booking_waiting_list FOR EACH ROW EXECUTE FUNCTION public.enforce_coaching_calendar();
CREATE OR REPLACE FUNCTION public.get_coaching_slot_counts(p_section uuid,p_date date) RETURNS TABLE(booking_time time,booking_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT b.booking_time,count(*) FROM public.booking_sessions b JOIN public.booking_sections s ON s.id=b.section_id WHERE s.id=p_section AND b.booking_date=p_date AND b.booking_type='videocall' AND b.status IN ('pending','confirmed') AND (public.has_role(auth.uid(),'admin') OR s.coach_id=public.current_app_user_id() OR public.owns_coaching_user(public.current_app_user_id(),s.coach_id) OR (s.coach_id IS NULL AND EXISTS(SELECT 1 FROM public.app_users u LEFT JOIN public.app_users c ON c.id=u.coach_id WHERE u.id=public.current_app_user_id() AND (u.coach_id IS NULL OR public.has_role(c.auth_user_id,'admin'))))) GROUP BY b.booking_time;
$$;
REVOKE ALL ON FUNCTION public.get_coaching_slot_counts(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_coaching_slot_counts(uuid,date) TO authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.booking_sections,public.booking_sessions,public.booking_waiting_list TO authenticated;
GRANT ALL ON public.booking_sections,public.booking_sessions,public.booking_waiting_list TO service_role;
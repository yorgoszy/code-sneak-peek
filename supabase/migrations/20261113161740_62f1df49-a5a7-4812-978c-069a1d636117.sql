CREATE TABLE public.measurement_protocols (key text PRIMARY KEY, name text NOT NULL, unit text NOT NULL, direction text NOT NULL, optojump_test text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.measurement_protocols TO authenticated; GRANT ALL ON public.measurement_protocols TO service_role;
ALTER TABLE public.measurement_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY measurement_protocol_read ON public.measurement_protocols FOR SELECT TO authenticated USING (true);
INSERT INTO public.measurement_protocols(key,name,unit,direction,optojump_test) VALUES ('cmj','CMJ · ύψος','cm','higher','CMJ'),('squat_jump','NCM / Squat Jump · ύψος','cm','higher','SQUAT JUMP'),('drop_jump','Drop Jump · ύψος','cm','higher','DROP JUMP'),('distance','Οριζόντια απόσταση','cm','higher',null),('reaction_visual','Οπτική αντίδραση','ms','lower',null),('reaction_audio','Ηχητική αντίδραση','ms','lower',null),('contact','Χρόνος επαφής','ms','observe',null),('flight','Χρόνος πτήσης','ms','observe',null),('velocity','Ταχύτητα','m/s','higher',null),('sprint_time','Χρόνος διαδρομής','ms','lower',null);
CREATE OR REPLACE FUNCTION public.can_access_measurements(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.app_users u WHERE u.id=p_user AND (u.auth_user_id=auth.uid() OR (u.coach_id=public.current_app_user_id() AND public.is_coach_safe(auth.uid()))))); $$;
REVOKE ALL ON FUNCTION public.can_access_measurements(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.can_access_measurements(uuid) TO authenticated,service_role;
CREATE TABLE public.exercise_measurement_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE, exercise_id uuid NOT NULL REFERENCES public.exercises(id), assignment_id uuid REFERENCES public.program_assignments(id) ON DELETE SET NULL, program_exercise_id uuid REFERENCES public.program_exercises(id) ON DELETE SET NULL, scheduled_date date, protocol_key text NOT NULL REFERENCES public.measurement_protocols(key), conditions text NOT NULL, session_kind text NOT NULL, baseline_value numeric, baseline_at timestamptz, threshold_pct numeric, started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.exercise_measurement_sessions TO authenticated; GRANT ALL ON public.exercise_measurement_sessions TO service_role;
ALTER TABLE public.exercise_measurement_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY measurement_session_read ON public.exercise_measurement_sessions FOR SELECT TO authenticated USING(public.can_access_measurements(user_id));
CREATE POLICY measurement_session_insert ON public.exercise_measurement_sessions FOR INSERT TO authenticated WITH CHECK(public.can_access_measurements(user_id));
CREATE POLICY measurement_session_update ON public.exercise_measurement_sessions FOR UPDATE TO authenticated USING(public.can_access_measurements(user_id)) WITH CHECK(public.can_access_measurements(user_id));
CREATE TABLE public.exercise_measurement_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES public.exercise_measurement_sessions(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE, event_id uuid NOT NULL DEFAULT gen_random_uuid(), value numeric NOT NULL, set_number integer NOT NULL, rep_number integer NOT NULL, source text NOT NULL, optojump_import_id uuid REFERENCES public.optojump_imports(id), recorded_at timestamptz NOT NULL DEFAULT now(), received_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id), UNIQUE(optojump_import_id), UNIQUE(session_id,set_number,rep_number));
GRANT SELECT,INSERT ON public.exercise_measurement_attempts TO authenticated; GRANT ALL ON public.exercise_measurement_attempts TO service_role;
ALTER TABLE public.exercise_measurement_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY measurement_attempt_read ON public.exercise_measurement_attempts FOR SELECT TO authenticated USING(public.can_access_measurements(user_id));
CREATE POLICY measurement_attempt_insert ON public.exercise_measurement_attempts FOR INSERT TO authenticated WITH CHECK(public.can_access_measurements(user_id));
CREATE INDEX measurement_session_lookup ON public.exercise_measurement_sessions(user_id,exercise_id,protocol_key,started_at);
CREATE INDEX measurement_attempt_lookup ON public.exercise_measurement_attempts(session_id,recorded_at);
CREATE OR REPLACE FUNCTION public.validate_measurement_session() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE d text; b numeric; bt timestamptz;
BEGIN
 IF NEW.session_kind NOT IN ('test','workout') OR length(trim(NEW.conditions))=0 OR length(NEW.conditions)>500 THEN RAISE EXCEPTION 'Invalid protocol conditions'; END IF;
 IF NEW.threshold_pct IS NOT NULL AND (NEW.threshold_pct<=0 OR NEW.threshold_pct>100) THEN RAISE EXCEPTION 'Invalid threshold'; END IF;
 IF TG_OP='UPDATE' THEN
  IF ROW(NEW.user_id,NEW.exercise_id,NEW.assignment_id,NEW.program_exercise_id,NEW.scheduled_date,NEW.protocol_key,NEW.conditions,NEW.session_kind,NEW.baseline_value,NEW.baseline_at,NEW.started_at) IS DISTINCT FROM ROW(OLD.user_id,OLD.exercise_id,OLD.assignment_id,OLD.program_exercise_id,OLD.scheduled_date,OLD.protocol_key,OLD.conditions,OLD.session_kind,OLD.baseline_value,OLD.baseline_at,OLD.started_at) THEN RAISE EXCEPTION 'Measurement session reference is immutable'; END IF;
 ELSE
  IF NEW.assignment_id IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM public.program_assignments a JOIN public.program_weeks w ON w.program_id=a.program_id JOIN public.program_days d ON d.week_id=w.id JOIN public.program_blocks b ON b.day_id=d.id JOIN public.program_exercises pe ON pe.block_id=b.id WHERE a.id=NEW.assignment_id AND a.user_id=NEW.user_id AND pe.id=NEW.program_exercise_id AND pe.exercise_id=NEW.exercise_id AND NEW.scheduled_date=ANY(a.training_dates)) THEN RAISE EXCEPTION 'Workout context does not match'; END IF;
  ELSIF NEW.program_exercise_id IS NOT NULL OR NEW.scheduled_date IS NOT NULL THEN RAISE EXCEPTION 'Missing workout assignment'; END IF;
  NEW.started_at=now(); NEW.baseline_value=null; NEW.baseline_at=null;
  SELECT direction INTO d FROM public.measurement_protocols WHERE key=NEW.protocol_key;
  IF d!='observe' THEN
   SELECT ma.value,ma.recorded_at INTO b,bt FROM public.exercise_measurement_attempts ma JOIN public.exercise_measurement_sessions s ON s.id=ma.session_id WHERE s.user_id=NEW.user_id AND s.exercise_id=NEW.exercise_id AND s.protocol_key=NEW.protocol_key AND s.conditions=NEW.conditions AND s.session_kind='test' AND ma.recorded_at<=NEW.started_at ORDER BY CASE WHEN d='higher' THEN -ma.value ELSE ma.value END,ma.recorded_at DESC LIMIT 1;
   NEW.baseline_value=b; NEW.baseline_at=bt;
  END IF;
 END IF;
 NEW.updated_at=now(); RETURN NEW;
END; $$;
CREATE TRIGGER validate_measurement_session BEFORE INSERT OR UPDATE ON public.exercise_measurement_sessions FOR EACH ROW EXECUTE FUNCTION public.validate_measurement_session();
CREATE OR REPLACE FUNCTION public.validate_measurement_attempt() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s public.exercise_measurement_sessions; p public.measurement_protocols; i public.optojump_imports;
BEGIN
 SELECT * INTO s FROM public.exercise_measurement_sessions WHERE id=NEW.session_id FOR UPDATE;
 IF NOT FOUND OR s.user_id!=NEW.user_id OR s.ended_at IS NOT NULL THEN RAISE EXCEPTION 'Invalid or closed measurement session'; END IF;
 IF NEW.set_number<1 OR NEW.rep_number<1 OR NEW.set_number>10000 OR NEW.rep_number>10000 THEN RAISE EXCEPTION 'Invalid set or repetition'; END IF;
 IF NEW.source='optojump_xml' THEN
  SELECT * INTO p FROM public.measurement_protocols WHERE key=s.protocol_key;
  SELECT * INTO i FROM public.optojump_imports WHERE id=NEW.optojump_import_id;
  IF NOT FOUND OR i.user_id!=s.user_id OR p.optojump_test IS NULL OR i.measurements->>'test' IS DISTINCT FROM p.optojump_test THEN RAISE EXCEPTION 'Incompatible OptoJump attempt'; END IF;
  NEW.value=(i.measurements->>'height_cm')::numeric; NEW.recorded_at=public.optojump_import_timestamp(i.measurements->>'recorded_at');
 ELSE
  IF NEW.source!='manual' OR NEW.optojump_import_id IS NOT NULL THEN RAISE EXCEPTION 'Unsupported measurement source'; END IF;
 END IF;
 IF NEW.value<=0 OR NEW.value::text IN ('NaN','Infinity','-Infinity') OR NEW.recorded_at>now()+interval '1 minute' THEN RAISE EXCEPTION 'Invalid measurement'; END IF;
 NEW.received_at=now(); NEW.updated_at=now(); RETURN NEW;
END; $$;
CREATE TRIGGER validate_measurement_attempt BEFORE INSERT ON public.exercise_measurement_attempts FOR EACH ROW EXECUTE FUNCTION public.validate_measurement_attempt();
CREATE OR REPLACE FUNCTION public.measurement_xml_candidates(p_user uuid,p_protocol text) RETURNS TABLE(id uuid,recorded_at text,height_cm numeric,test text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.can_access_measurements(p_user) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 RETURN QUERY SELECT i.id,i.measurements->>'recorded_at',(i.measurements->>'height_cm')::numeric,i.measurements->>'test' FROM public.optojump_imports i JOIN public.measurement_protocols p ON p.key=p_protocol AND p.optojump_test=i.measurements->>'test' WHERE i.user_id=p_user AND NOT EXISTS(SELECT 1 FROM public.exercise_measurement_attempts a WHERE a.optojump_import_id=i.id) ORDER BY i.created_at DESC LIMIT 100;
END; $$;
REVOKE ALL ON FUNCTION public.measurement_xml_candidates(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.measurement_xml_candidates(uuid,text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_measurement_attempts;
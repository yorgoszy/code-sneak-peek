CREATE TABLE public.optojump_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_key text NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
 session_id uuid NOT NULL REFERENCES public.jump_test_sessions(id) ON DELETE CASCADE,
 measurements jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.optojump_imports TO authenticated;
GRANT ALL ON public.optojump_imports TO service_role;
ALTER TABLE public.optojump_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY optojump_admin_read ON public.optojump_imports FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.optojump_import_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER optojump_import_updated BEFORE UPDATE ON public.optojump_imports FOR EACH ROW EXECUTE FUNCTION public.optojump_import_timestamp();
CREATE FUNCTION public.import_optojump_attempt(p_user_id uuid,p_attempt jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.app_users%ROWTYPE; existing public.optojump_imports%ROWTYPE; key text; sid uuid; kind text; height numeric; flight numeric; contact numeric; rsi numeric; day date; stamp timestamp; actor uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only administrators can import OptoJump results' USING ERRCODE='42501'; END IF;
 SELECT * INTO u FROM public.app_users WHERE id=p_user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
 IF u.coach_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.app_users owner WHERE owner.id=u.coach_id AND public.has_role(owner.auth_user_id,'admin')) THEN RAISE EXCEPTION 'This version imports only admin-owned user results'; END IF;
 IF jsonb_typeof(p_attempt)<>'object' OR octet_length(p_attempt::text)>16384 THEN RAISE EXCEPTION 'Invalid attempt'; END IF;
 kind:=p_attempt->>'test';
 IF kind NOT IN('SQUAT JUMP','CMJ','DROP JUMP') OR kind IS NULL THEN RAISE EXCEPTION 'Unsupported test'; END IF;
 IF coalesce(length(p_attempt->>'external_person'),0) NOT BETWEEN 1 AND 512 OR coalesce(length(p_attempt->>'attempt'),0) NOT BETWEEN 1 AND 32 THEN RAISE EXCEPTION 'Missing source identity'; END IF;
 stamp:=(p_attempt->>'recorded_at')::timestamp; day:=stamp::date;
 height:=(p_attempt->>'height_cm')::numeric;
 flight:=(p_attempt->>'flight_seconds')::numeric;
 contact:=nullif(p_attempt->>'contact_seconds','')::numeric;
 rsi:=nullif(p_attempt->>'rsi','')::numeric;
 IF stamp IS NULL OR height IS NULL OR flight IS NULL OR height<=0 OR height>200 OR flight<=0 OR flight>5 OR (contact IS NOT NULL AND (contact<=0 OR contact>60)) OR (rsi IS NOT NULL AND (rsi<0 OR rsi>100)) THEN RAISE EXCEPTION 'Invalid measurements'; END IF;
 key:=jsonb_build_array(p_attempt->>'external_person',kind,stamp,p_attempt->>'attempt')::text;
 PERFORM pg_advisory_xact_lock(hashtextextended(key,0));
 SELECT * INTO existing FROM public.optojump_imports WHERE source_key=key;
 IF FOUND THEN
  IF existing.user_id<>p_user_id OR existing.measurements IS DISTINCT FROM p_attempt THEN RAISE EXCEPTION 'Previously imported attempt differs; review mapping or corrected measurements'; END IF;
  RETURN jsonb_build_object('status','duplicate','session_id',existing.session_id);
 END IF;
 actor:=public.current_app_user_id();
 INSERT INTO public.jump_test_sessions(user_id,test_date,created_by,notes)
 VALUES(p_user_id,day,actor,'OptoJump '||kind||' | '||stamp::text||' | attempt '||(p_attempt->>'attempt')||' | Flight: '||flight||' s'||CASE WHEN contact IS NOT NULL THEN ' | Contact: '||contact||' s' ELSE '' END||CASE WHEN rsi IS NOT NULL THEN ' | RSI: '||rsi ELSE '' END) RETURNING id INTO sid;
 INSERT INTO public.jump_test_data(test_session_id,non_counter_movement_jump,counter_movement_jump,depth_jump)
 VALUES(sid,CASE WHEN kind='SQUAT JUMP' THEN height END,CASE WHEN kind='CMJ' THEN height END,CASE WHEN kind='DROP JUMP' THEN height END);
 INSERT INTO public.optojump_imports(source_key,user_id,session_id,measurements) VALUES(key,p_user_id,sid,p_attempt);
 RETURN jsonb_build_object('status','imported','session_id',sid);
END $$;
REVOKE ALL ON FUNCTION public.import_optojump_attempt(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.import_optojump_attempt(uuid,jsonb) TO authenticated;

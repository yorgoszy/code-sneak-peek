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
  NEW.value=(i.measurements->>'height_cm')::numeric; NEW.recorded_at=((i.measurements->>'recorded_at')::timestamp AT TIME ZONE 'Europe/Athens');
 ELSE
  IF NEW.source!='manual' OR NEW.optojump_import_id IS NOT NULL THEN RAISE EXCEPTION 'Unsupported measurement source'; END IF;
 END IF;
 IF NEW.value<=0 OR NEW.value::text IN ('NaN','Infinity','-Infinity') OR NEW.recorded_at>now()+interval '1 minute' THEN RAISE EXCEPTION 'Invalid measurement'; END IF;
 NEW.received_at=now(); NEW.updated_at=now(); RETURN NEW;
END; $$;
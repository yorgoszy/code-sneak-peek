-- Runs with temporary fixtures; every change rolls back.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
INSERT INTO public.app_users(id,name,email,role,coach_id) VALUES
 ('00000000-0000-4000-8000-000000000101','Calendar test coach A','calendar-a@example.invalid','coach',NULL),
 ('00000000-0000-4000-8000-000000000102','Calendar test coach B','calendar-b@example.invalid','coach',NULL),
 ('00000000-0000-4000-8000-000000000103','Calendar test user','calendar-user@example.invalid','athlete','00000000-0000-4000-8000-000000000101');
INSERT INTO public.booking_sections(id,name,coach_id,booking_type,available_hours) VALUES
 ('00000000-0000-4000-8000-000000000201','Test A','00000000-0000-4000-8000-000000000101','videocall','{}'),
 ('00000000-0000-4000-8000-000000000202','Test B','00000000-0000-4000-8000-000000000102','videocall','{}');
DO $$ BEGIN
 BEGIN
  INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type) VALUES('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000202',CURRENT_DATE+1,'12:00','videocall');
  RAISE EXCEPTION 'Other coach booking was accepted';
 EXCEPTION WHEN check_violation THEN IF SQLERRM<>'Μπορείς να κλείσεις μόνο στο ημερολόγιο του δικού σου coach' THEN RAISE; END IF; END;
 BEGIN
  INSERT INTO public.booking_waiting_list(user_id,section_id,booking_date,booking_time,booking_type,position) VALUES('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000202',CURRENT_DATE+1,'12:00','videocall',1);
  RAISE EXCEPTION 'Other coach waiting list was accepted';
 EXCEPTION WHEN check_violation THEN IF SQLERRM<>'Μπορείς να κλείσεις μόνο στο ημερολόγιο του δικού σου coach' THEN RAISE; END IF; END;
END $$;
INSERT INTO public.booking_sessions(id,user_id,section_id,booking_date,booking_time,booking_type,status) VALUES('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000201',CURRENT_DATE+1,'12:00','videocall','completed');
DO $$ BEGIN
 IF (SELECT coach_id FROM public.booking_sessions WHERE id='00000000-0000-4000-8000-000000000301') IS DISTINCT FROM '00000000-0000-4000-8000-000000000101'::uuid THEN RAISE EXCEPTION 'Assigned coach was not persisted'; END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.booking_sessions WHERE id='00000000-0000-4000-8000-000000000301') THEN RAISE EXCEPTION 'Unrelated account can see coach appointment'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
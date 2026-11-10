-- Regression: a restricted HYPERGYM subscription must not undo the admin's
-- explicit recurring assignment. All changes are rolled back.
BEGIN;
DO $$ DECLARE admin_id uuid; BEGIN
 SELECT r.user_id INTO admin_id FROM public.user_roles r
 JOIN public.app_users u ON u.auth_user_id=r.user_id WHERE r.role='admin' LIMIT 1;
 IF admin_id IS NULL THEN RAISE EXCEPTION 'Test needs an admin'; END IF;
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE saved integer; BEGIN
 saved:=public.save_admin_section_assignment(
  '0ad5e61d-b753-43c2-b47c-9a93ae9d2886',
  '83b57acf-5997-43b2-8aed-c45d0efc1171',
  '{"monday":["18:00"],"wednesday":["18:00"],"friday":["18:00"]}'
 );
 IF saved<=0 THEN RAISE EXCEPTION 'No recurring bookings created'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.app_users
  WHERE id='0ad5e61d-b753-43c2-b47c-9a93ae9d2886'
  AND section_id='83b57acf-5997-43b2-8aed-c45d0efc1171'
  AND section_schedule='{"monday":["18:00"],"wednesday":["18:00"],"friday":["18:00"]}'::jsonb
 ) THEN RAISE EXCEPTION 'New section and schedule did not read back'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.booking_sessions
  WHERE user_id='0ad5e61d-b753-43c2-b47c-9a93ae9d2886'
  AND coach_id IS NULL AND booking_type='gym_visit'
  AND status IN('pending','confirmed')
  AND booking_date >= (now() AT TIME ZONE 'Europe/Athens')::date
  AND section_id IS DISTINCT FROM '83b57acf-5997-43b2-8aed-c45d0efc1171'::uuid
 ) THEN RAISE EXCEPTION 'Old future section remains'; END IF;
END $$;
RESET ROLE;
DO $$ DECLARE day date; BEGIN
 SELECT min(booking_date) INTO day FROM public.booking_sessions
 WHERE user_id='0ad5e61d-b753-43c2-b47c-9a93ae9d2886'
 AND section_id='83b57acf-5997-43b2-8aed-c45d0efc1171'
 AND status='confirmed' AND booking_date>=(now() AT TIME ZONE 'Europe/Athens')::date;
 -- Even an admin may not use the exception for an unsaved hour.
 BEGIN
  INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type,status)
  VALUES('0ad5e61d-b753-43c2-b47c-9a93ae9d2886','83b57acf-5997-43b2-8aed-c45d0efc1171',day,'17:00','gym_visit','confirmed');
  RAISE EXCEPTION 'Unsaved hour bypassed subscription restrictions';
 EXCEPTION WHEN check_violation THEN NULL; END;
 -- Isolate trigger validation from RLS: non-admin callers still cannot book
 -- this section even though the admin has saved recurring attendance there.
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN
  INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type,status)
  VALUES('0ad5e61d-b753-43c2-b47c-9a93ae9d2886','83b57acf-5997-43b2-8aed-c45d0efc1171',day,'18:00','gym_visit','confirmed');
  RAISE EXCEPTION 'Ordinary caller bypassed subscription restrictions';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT 'PASS: section change reads back; old future bookings removed; unsaved hours and ordinary callers remain restricted' AS result;
ROLLBACK;
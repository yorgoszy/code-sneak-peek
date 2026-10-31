-- Regression tests use the reported existing subscription; all test writes roll back.
DO $test$
DECLARE
  v_user uuid := '371d1bb6-ee37-4824-8a64-50a21013f7e3';
  v_allowed uuid := 'c7cf36ab-47be-4727-94b7-dfbd25bb1d95';
  v_other uuid;
  v_sections jsonb;
BEGIN
  v_sections := public.get_user_available_bookings(v_user)->'allowed_sections';
  IF v_sections IS DISTINCT FROM jsonb_build_array(v_allowed) THEN
    RAISE EXCEPTION 'Expected exactly the selected subscription section, got %', v_sections;
  END IF;
  SELECT id INTO v_other FROM public.booking_sections WHERE id<>v_allowed LIMIT 1;
  IF v_other IS NULL THEN RAISE EXCEPTION 'Another section is required for the test'; END IF;

  BEGIN
    INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type,status)
    VALUES(v_user,v_other,CURRENT_DATE+1,'12:00','gym_visit','confirmed');
    RAISE EXCEPTION 'Disallowed booking was accepted';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'Η συνδρομή σου δεν επιτρέπει κρατήσεις σε αυτό το τμήμα' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO public.booking_waiting_list(user_id,section_id,booking_date,booking_time,booking_type,status,position)
    VALUES(v_user,v_other,CURRENT_DATE+1,'12:00','gym_visit','waiting',1);
    RAISE EXCEPTION 'Disallowed waiting-list entry was accepted';
  EXCEPTION WHEN check_violation THEN
    IF SQLERRM <> 'Η συνδρομή σου δεν επιτρέπει κρατήσεις σε αυτό το τμήμα' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type,status)
    VALUES(v_user,v_allowed,CURRENT_DATE+1,'12:00','gym_visit','confirmed');
    RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Rollback allowed test booking';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
END;
$test$;
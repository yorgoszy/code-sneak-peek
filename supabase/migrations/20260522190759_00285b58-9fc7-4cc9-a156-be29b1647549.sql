-- Duplicate program 'a5e37d5f-62a3-4610-b7da-ca6c80979eda' (5 ιουλιου) as a draft template for user info@hyperkids.gr
DO $$
DECLARE
  src_program_id uuid := 'a5e37d5f-62a3-4610-b7da-ca6c80979eda';
  owner_id uuid := 'c6d44641-3b95-46bd-8270-e5ed72de25ad';
  new_program_id uuid := gen_random_uuid();
  wk RECORD;
  d RECORD;
  b RECORD;
  new_week_id uuid;
  new_day_id uuid;
  new_block_id uuid;
BEGIN
  -- Clone program with is_template=true
  INSERT INTO public.programs (id, name, description, type, duration, status, created_by, is_template, user_id, start_date, training_days, coach_id, price, is_sellable)
  SELECT new_program_id, name || ' (Draft)', description, type, duration, status, owner_id, true, NULL, NULL, training_days, owner_id, price, false
  FROM public.programs WHERE id = src_program_id;

  FOR wk IN SELECT * FROM public.program_weeks WHERE program_id = src_program_id ORDER BY week_number LOOP
    new_week_id := gen_random_uuid();
    INSERT INTO public.program_weeks (id, program_id, name, week_number)
    VALUES (new_week_id, new_program_id, wk.name, wk.week_number);

    FOR d IN SELECT * FROM public.program_days WHERE week_id = wk.id ORDER BY day_number LOOP
      new_day_id := gen_random_uuid();
      INSERT INTO public.program_days (id, week_id, name, day_number, estimated_duration_minutes, is_test_day, test_types, is_competition_day, upper_effort, lower_effort, is_esd_day, is_recovery_day)
      VALUES (new_day_id, new_week_id, d.name, d.day_number, d.estimated_duration_minutes, d.is_test_day, d.test_types, d.is_competition_day, d.upper_effort, d.lower_effort, d.is_esd_day, d.is_recovery_day);

      FOR b IN SELECT * FROM public.program_blocks WHERE day_id = d.id ORDER BY block_order LOOP
        new_block_id := gen_random_uuid();
        INSERT INTO public.program_blocks (id, day_id, name, block_order, training_type, workout_format, workout_duration, block_sets)
        VALUES (new_block_id, new_day_id, b.name, b.block_order, b.training_type, b.workout_format, b.workout_duration, b.block_sets);

        INSERT INTO public.program_exercises (id, block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode)
        SELECT gen_random_uuid(), new_block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode
        FROM public.program_exercises WHERE block_id = b.id ORDER BY exercise_order;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;